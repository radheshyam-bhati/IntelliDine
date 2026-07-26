from fastapi import APIRouter, HTTPException
from models import (
    ForecastRequest,
    ForecastResponse,
    ForecastItem,
    TrainRequest,
    TrainResponse,
    HealthResponse,
)
from forecaster import ForecastEngine

router = APIRouter()
engine = ForecastEngine()


@router.get("/health", response_model=HealthResponse)
async def health():
    mode = "trained" if engine._models else "cold_start"
    return HealthResponse(status="ok", mode=mode)


@router.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
    historical_dicts = [h.model_dump() for h in request.historical_data]
    results = engine.predict(
        restaurant_id=request.restaurant_id,
        menu_item_ids=request.menu_item_ids,
        forecast_date=request.forecast_date,
        historical_data=historical_dicts,
    )
    items = [ForecastItem(**r) for r in results]
    return ForecastResponse(forecasts=items)


@router.post("/train", response_model=TrainResponse)
async def train(request: TrainRequest):
    if not request.historical_data:
        raise HTTPException(status_code=400, detail="historical_data must not be empty")
    historical_dicts = [h.model_dump() for h in request.historical_data]
    result = engine.train(
        restaurant_id=request.restaurant_id,
        historical_data=historical_dicts,
    )
    return TrainResponse(**result)
