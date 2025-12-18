from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.inflow_service import InflowService
from app.services.order_service import OrderService
import logging

logger = logging.getLogger(__name__)


async def sync_inflow_orders():
    """Background task to sync orders from Inflow"""
    db = SessionLocal()
    try:
        inflow_service = InflowService()
        order_service = OrderService(db)

        logger.info("Starting Inflow sync...")

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

        logger.info(f"Inflow sync completed: {len(inflow_orders)} synced, {orders_created} created, {orders_updated} updated")

    except Exception as e:
        logger.error(f"Inflow sync failed: {e}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    """Start the APScheduler for periodic Inflow sync"""
    scheduler = AsyncIOScheduler()

    # Sync every 5 minutes
    scheduler.add_job(
        sync_inflow_orders,
        trigger=IntervalTrigger(minutes=5),
        id="inflow_sync",
        name="Sync orders from Inflow",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started - Inflow sync every 5 minutes")
    return scheduler
