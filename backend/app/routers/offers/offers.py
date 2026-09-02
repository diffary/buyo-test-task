import random
from datetime import datetime, date

from fastapi import APIRouter, Request, Depends

from app.db import Repo
from app.db.models import User
from app.utils.enums import (
    RoleTypes,
    TRAFFIC_TRELLO_OFFERS,
    TRAFFIC_INVENTORY,
    TRAFFIC_APPROVE_STATUSES,
    TRAFFIC_CAMPAIGNS,
    TRAFFIC_MONTH_MINUS_OFFERS,
    TRAFFIC_PREORDER_MARKED_OFFERS,
    TRAFFIC_NEW_MARKED_OFFERS,
    TRAFFIC_ROI_MARKED_OFFERS,
    TRAFFIC_OFFERS_ADDITIONAL_DATA,
    TRAFFIC_ACTIVE_STATUS,
    TRAFFIC_ACTIVITY_STATUSES,
    TRAFFIC_ACTIVE_CAMPAIGNS_RANGE,
    TRAFFIC_MARK_OPTIONS,
    TRAFFIC_TRELLO_COLUMNS,
)
from app.utils.misc import auth_user, get_offer_percentage_rate, normalize_offer_id
from app.utils.orders import generate_offers_data, generate_offer_data

router = APIRouter(prefix='/api/offers')

def _randomize_traffic_offer_metadata(rows: list[dict]) -> None:
    """Add mock integration metadata to rows returned by the legacy traffic API."""
    columns_by_offer: dict[str, str] = {}
    marks_by_offer: dict[str, tuple[str, str]] = {}
    activity_by_flow: dict[tuple[str, str], tuple[str, int]] = {}

    for row in rows:
        offer_id = str(row.get("offer_id") or "")
        buyer_id = str(row.get("buyer_id") or "")
        normalized_offer_id = normalize_offer_id(offer_id)
        activity_key = (offer_id, buyer_id)

        if normalized_offer_id not in columns_by_offer:
            columns_by_offer[normalized_offer_id] = random.choice(TRAFFIC_TRELLO_COLUMNS)
            marks_by_offer[normalized_offer_id] = random.choice(TRAFFIC_MARK_OPTIONS)

        if activity_key not in activity_by_flow:
            status = random.choice(TRAFFIC_ACTIVITY_STATUSES)
            campaigns = (
                random.randint(*TRAFFIC_ACTIVE_CAMPAIGNS_RANGE)
                if status == TRAFFIC_ACTIVE_STATUS
                else 0
            )
            activity_by_flow[activity_key] = status, campaigns

        status, campaigns = activity_by_flow[activity_key]
        mark_symbol, mark_tip = marks_by_offer[normalized_offer_id]

        row["status"] = status
        row["campaigns"] = campaigns
        row["marks"] = [{"symbol": mark_symbol, "tip": mark_tip}]
        row["column"] = columns_by_offer[normalized_offer_id]


@router.get("/traffic")
async def get_traffic_offers(request: Request, since: str, until: str,  with_lifetime: bool, with_month: bool, current: tuple[User, Repo] = Depends(auth_user)):
    user, repo = current

    since = datetime.strptime(since, "%Y-%m-%d").replace(hour=0, minute=0, second=0)

    (
        orders_period,
        insight_period,
        orders_month,
        insight_month,
        orders_lifetime,
        insight_lifetime
    ) = await repo.get_offers_data(
        buyers=await repo.get_user_accessed_logins(user, is_traffic=True),
        since=since,
        until=datetime.strptime(until, "%Y-%m-%d").replace(hour=23, minute=59, second=59),
        with_month=with_month,
        with_lifetime=with_lifetime if user.role in (RoleTypes.admin, RoleTypes.owner) else False
    )
    global_rate = float((await repo.get_global_exchange_rate()).value)

    result, buyer_ids = await generate_offers_data(
        offers_data=TRAFFIC_TRELLO_OFFERS,
        inventory=TRAFFIC_INVENTORY,
        approve_statuses=TRAFFIC_APPROVE_STATUSES,
        campaigns_data=TRAFFIC_CAMPAIGNS,
        month_minus_offers_data=TRAFFIC_MONTH_MINUS_OFFERS,
        preorder_marked_offers=TRAFFIC_PREORDER_MARKED_OFFERS,
        new_marked_offers=TRAFFIC_NEW_MARKED_OFFERS,
        roi_marked_offers=TRAFFIC_ROI_MARKED_OFFERS,
        offers_additional_data=TRAFFIC_OFFERS_ADDITIONAL_DATA,
        orders_period=orders_period,
        orders_month=orders_month,
        insight_period=insight_period,
        insight_month=insight_month,
        sum_usd_rate=global_rate,
        month=with_month,
        lifetime=with_lifetime,
        orders_lifetime=orders_lifetime,
        insight_lifetime=insight_lifetime,
        is_old_kpi=since.date() <= date(day=25, month=10, year=2025)
    )
    _randomize_traffic_offer_metadata(result)

    return {
        "success": True,
        "data": {
            "exchange_rate": global_rate,
            "buyer_ids": buyer_ids,
            "data": result
        }
    }

@router.get("/traffic/offer")
async def get_traffic_offer(request: Request, since: str, until: str, offer_id: str, buyer_id: str, site_type: str, current: tuple[User, Repo] = Depends(auth_user)):
    user, repo = current

    since = datetime.strptime(since, "%Y-%m-%d").replace(hour=0, minute=0, second=0)

    (
        orders,
        insights
    ) = await repo.get_offer_data(
        since=since,
        until=datetime.strptime(until, "%Y-%m-%d").replace(hour=23, minute=59, second=59),
        site_type=site_type,
        offer_id=offer_id,
        buyer_id=buyer_id
    )
    global_rate = float((await repo.get_global_exchange_rate()).value)

    return {
        "success": True,
        "data": await generate_offer_data(
            orders=orders,
            insights=insights,
            sum_usd_rate=global_rate,
        )
    }

