# KitchenSync Forecast Service

Predicts next-day dish demand using historical order data.

## Endpoints

| Method | Path        | Description                                      |
|--------|-------------|--------------------------------------------------|
| GET    | `/health`   | Service health and current mode                  |
| POST   | `/forecast` | Predict demand for menu items                    |
| POST   | `/train`    | Train a per-restaurant model from order history  |

## How to run

```bash
cd services/forecast
pip install -r requirements.txt
python main.py
```

Or with Docker:

```bash
docker build -t kitchensync-forecast .
docker run -p 8000:8000 kitchensync-forecast
```

## Modes

- **cold_start_baseline**: day-of-week averages, used when insufficient restaurant data exists
- **restaurant_trained**: same-day-of-week moving average over 8 weeks, used when >= 28 days of history and >= 3 same-day-of-week orders exist for a menu item
