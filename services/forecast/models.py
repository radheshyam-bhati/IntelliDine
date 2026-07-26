from pydantic import BaseModel
from typing import Literal
from datetime import date


class HistoricalDataPoint(BaseModel):
    menu_item_id: str
    date: date
    quantity: int


class ForecastRequest(BaseModel):
    restaurant_id: str
    menu_item_ids: list[str]
    forecast_date: date
    historical_data: list[HistoricalDataPoint]


class ForecastItem(BaseModel):
    menu_item_id: str
    predicted_quantity: float
    basis: Literal["cold_start_baseline", "restaurant_trained"]
    confidence: float


class ForecastResponse(BaseModel):
    forecasts: list[ForecastItem]


class TrainRequest(BaseModel):
    restaurant_id: str
    historical_data: list[HistoricalDataPoint]


class TrainResponse(BaseModel):
    restaurant_id: str
    trained_items: int
    message: str


class HealthResponse(BaseModel):
    status: str
    mode: Literal["cold_start", "trained"]
