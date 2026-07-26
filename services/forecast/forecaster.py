from datetime import date, timedelta
from collections import defaultdict

DOW_AVERAGES = {
    0: 42, 1: 38, 2: 40, 3: 41, 4: 55, 5: 72, 6: 68,
}

TRAINING_THRESHOLD_DAYS = 28
SAME_DOW_THRESHOLD = 3


def _dow_from_date(d: date) -> int:
    return d.weekday()


class ForecastEngine:
    def __init__(self):
        self._models: dict[str, dict[str, list[dict]]] = {}

    def _cold_start_confidence(self, data_points: int) -> float:
        return min(0.5, data_points / 20)

    def _trained_confidence(self, data_points: int) -> float:
        return min(0.9, data_points / 50)

    def _cold_start_prediction(self, menu_item_id: str, forecast_date: date,
                               historical_data: list[dict]) -> tuple[float, float]:
        dow = _dow_from_date(forecast_date)
        relevant = [h for h in historical_data if h["menu_item_id"] == menu_item_id]
        if not relevant:
            overall_avg = sum(DOW_AVERAGES.values()) / len(DOW_AVERAGES)
            multiplier = 0.8 if dow in (5, 6) else 1.2
            pred = overall_avg * multiplier
            conf = self._cold_start_confidence(0)
            return pred, conf

        total = sum(h["quantity"] for h in relevant)
        n = len(relevant)
        avg = total / n

        if dow in (5, 6):
            pred = avg * 1.2
        else:
            pred = avg * 0.8

        pred = max(pred, 1.0)
        conf = self._cold_start_confidence(n)
        return pred, conf

    def _trained_prediction(self, menu_item_id: str, forecast_date: date,
                            historical_data: list[dict]) -> tuple[float, float]:
        dow = _dow_from_date(forecast_date)
        eight_weeks_ago = forecast_date - timedelta(weeks=8)
        same_dow = [
            h for h in historical_data
            if h["menu_item_id"] == menu_item_id
            and _dow_from_date(h["date"]) == dow
            and h["date"] >= eight_weeks_ago
        ]
        same_dow.sort(key=lambda h: h["date"])

        if not same_dow:
            return self._cold_start_prediction(menu_item_id, forecast_date, historical_data)

        total = sum(h["quantity"] for h in same_dow)
        n = len(same_dow)
        pred = max(total / n, 1.0)
        conf = self._trained_confidence(n)
        return pred, conf

    def _has_sufficient_data(self, menu_item_id: str, forecast_date: date,
                             historical_data: list[dict]) -> bool:
        relevant = [h for h in historical_data if h["menu_item_id"] == menu_item_id]
        if len(relevant) < TRAINING_THRESHOLD_DAYS:
            return False

        dow = _dow_from_date(forecast_date)
        same_dow_count = sum(
            1 for h in relevant if _dow_from_date(h["date"]) == dow
        )
        return same_dow_count >= SAME_DOW_THRESHOLD

    def predict(self, restaurant_id: str, menu_item_ids: list[str],
                forecast_date: date, historical_data: list[dict]) -> list[dict]:
        results = []
        for item_id in menu_item_ids:
            if self._has_sufficient_data(item_id, forecast_date, historical_data):
                pred, conf = self._trained_prediction(item_id, forecast_date, historical_data)
                basis = "restaurant_trained"
            else:
                pred, conf = self._cold_start_prediction(item_id, forecast_date, historical_data)
                basis = "cold_start_baseline"
            results.append({
                "menu_item_id": item_id,
                "predicted_quantity": round(pred, 2),
                "basis": basis,
                "confidence": round(conf, 2),
            })
        return results

    def train(self, restaurant_id: str, historical_data: list[dict]) -> dict:
        grouped: dict[str, list[dict]] = defaultdict(list)
        for h in historical_data:
            grouped[h["menu_item_id"]].append(h)
        self._models[restaurant_id] = dict(grouped)
        return {
            "restaurant_id": restaurant_id,
            "trained_items": len(grouped),
            "message": f"Trained {len(grouped)} menu items for restaurant {restaurant_id}",
        }
