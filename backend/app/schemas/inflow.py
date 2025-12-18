from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InflowSyncResponse(BaseModel):
    success: bool
    orders_synced: int
    orders_created: int
    orders_updated: int
    message: str


class InflowSyncStatusResponse(BaseModel):
    last_sync_at: Optional[datetime] = None
    total_orders: int
    sync_enabled: bool
