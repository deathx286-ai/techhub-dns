from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.database import get_db
from app.services.inflow_service import InflowService
from app.services.order_service import OrderService
from app.schemas.inflow import InflowSyncResponse, InflowSyncStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inflow", tags=["inflow"])


@router.post("/sync", response_model=InflowSyncResponse)
async def sync_orders(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger Inflow sync"""
    try:
        inflow_service = InflowService()
        order_service = OrderService(db)

        # Fetch recent started orders
        inflow_orders = await inflow_service.sync_recent_started_orders(
            max_pages=3,
            per_page=100,
            target_matches=100
        )

        orders_created = 0
        orders_updated = 0

        for inflow_order in inflow_orders:
            try:
                from app.models.order import Order
                order_number = inflow_order.get("orderNumber")
                existing = db.query(Order).filter(
                    Order.inflow_order_id == order_number
                ).first()

                order = order_service.create_order_from_inflow(inflow_order)
                if not existing:
                    orders_created += 1
                else:
                    orders_updated += 1
            except Exception as e:
                logger.error(f"Error processing order {inflow_order.get('orderNumber')}: {e}", exc_info=True)
                continue

        return InflowSyncResponse(
            success=True,
            orders_synced=len(inflow_orders),
            orders_created=orders_created,
            orders_updated=orders_updated,
            message=f"Synced {len(inflow_orders)} orders"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sync-status", response_model=InflowSyncStatusResponse)
def get_sync_status(db: Session = Depends(get_db)):
    """Get Inflow sync status"""
    from app.models.order import Order

    total_orders = db.query(Order).count()

    return InflowSyncStatusResponse(
        last_sync_at=None,  # Could track this in a separate table
        total_orders=total_orders,
        sync_enabled=True
    )
