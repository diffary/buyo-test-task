from datetime import datetime

from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, Order, Insight, Variable
from app.utils.enums import VariableTypes, RoleTypes, ORDER_METHODS, BuyerStatuses, OrdersAccess, CPA_SITE_NAMES, LaunchSources


class BaseRepo:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def scalar_one(self, stmt):
        return (await self.session.execute(stmt)).scalar_one()

    async def scalars_all(self, stmt):
        return (await self.session.scalars(stmt)).all()


class Repo(BaseRepo):
    async def get_user(self, user_id: str) -> User | None:
        return await self.session.scalar(select(User).where(User.id == user_id))

    async def get_offers_data(
        self,
        buyers: list[str] | None,
        since: datetime,
        until: datetime,
        with_month: bool,
        with_lifetime: bool
    ):
        return (
            await self.scalars_all(
                select(Order).where(
                    Order.status != 'testy',
                    Order.method.in_(ORDER_METHODS),
                    Order.offer_id != None,
                    ~Order.offer_id.like("test-%"),
                    Order.buyer_id.in_(buyers),
                    since <= Order.created_at,
                    Order.created_at <= until
                ).order_by(asc(Order.buyer_id))
            ),
            await self.scalars_all(
                select(Insight).where(
                    Insight.launch_source == LaunchSources.internal,
                    Insight.type.notin_(CPA_SITE_NAMES),
                    ~Insight.offer_id.like("test-%"),
                    Insight.buyer_id.in_(buyers),
                    since <= Insight.day,
                    Insight.day <= until
                )
            ),
            await self.scalars_all(
                select(Order).where(
                    Order.status != 'testy',
                    Order.method.in_(ORDER_METHODS),
                    Order.offer_id != None,
                    ~Order.offer_id.like("test-%"),
                    Order.buyer_id.in_(buyers),
                    datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) <= Order.created_at
                ).order_by(asc(Order.buyer_id))
            ) if with_month else [],
            await self.scalars_all(
                select(Insight).where(
                    Insight.launch_source == LaunchSources.internal,
                    Insight.type.notin_(CPA_SITE_NAMES),
                    ~Insight.offer_id.like("test-%"),
                    Insight.buyer_id.in_(buyers),
                    datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) <= Insight.day
                )
            ) if with_month else [],
            await self.scalars_all(
                select(Order).where(
                    Order.offer_id != None,
                    ~Order.offer_id.like("test-%"),
                    Order.buyer_id.in_(buyers),
                    Order.method.in_(ORDER_METHODS)
                ).order_by(asc(Order.buyer_id))
            ) if with_lifetime else [],
            await self.scalars_all(
                select(Insight).where(
                    Insight.launch_source == LaunchSources.internal,
                    Insight.type.notin_(CPA_SITE_NAMES),
                    ~Insight.offer_id.like("test-%")
                )
            ) if with_lifetime else []
        )

    async def get_offer_data(
        self,
        since: datetime,
        until: datetime,
        site_type: str,
        offer_id: str,
        buyer_id: str
    ) -> list[Order]:
        if site_type == 'Лендинг':
            return (
                await self.scalars_all(
                    select(Order).where(
                        Order.status != 'testy',
                        Order.offer_id == offer_id,
                        Order.buyer_id == buyer_id,
                        Order.method == 'landing-page',
                        since <= Order.created_at,
                        Order.created_at <= until
                    )
                ),
                await self.scalars_all(
                    select(Insight).where(
                        Insight.launch_source == LaunchSources.internal,
                        Insight.type.notin_(CPA_SITE_NAMES),
                        Insight.offer_id == offer_id,
                        Insight.buyer_id == buyer_id,
                        Insight.type != 'buyo',
                        since.date() <= Insight.day,
                        Insight.day <= until.date()
                    )
                )
            )

        else:
            return (
                await self.scalars_all(
                    select(Order).where(
                        Order.status != 'testy',
                        Order.offer_id == offer_id,
                        Order.buyer_id == buyer_id,
                        Order.method.in_(('shopping-cart', 'unfinished-checkout', 'bot-confirm', 'popup-callback-60s', 'consult')),
                        since <= Order.created_at,
                        Order.created_at <= until
                    )
                ),
                await self.scalars_all(
                    select(Insight).where(
                        Insight.launch_source == LaunchSources.internal,
                        Insight.type.notin_(CPA_SITE_NAMES),
                        Insight.offer_id == offer_id,
                        Insight.buyer_id == buyer_id,
                        Insight.type == 'buyo',
                        since.date() <= Insight.day,
                        Insight.day <= until.date()
                    )
                )
            )

    async def get_global_exchange_rate(self) -> Variable | None:
        return await self.session.scalar(select(Variable).where(Variable.type == VariableTypes.global_exchange_rate))

    async def get_user_by_login(self, login: str) -> User | None:
        return await self.session.scalar(select(User).where(User.login == login))

    async def get_active_buyers(self, only_login: bool = True, active: bool = False) -> list[User] | list[str]:
        if only_login:
            if active:
                return await self.scalars_all(select(User.login).where(User.is_active == True))

            else:
                return await self.scalars_all(select(User.login))

        else:
            return await self.scalars_all(select(User))

    async def get_user_accessed_logins(self, user: User, is_traffic: bool = False):
        if is_traffic:
            if user.role in (RoleTypes.admin, RoleTypes.owner) or user.access == OrdersAccess.all or user.buyer_status in (BuyerStatuses.middle, BuyerStatuses.senior, BuyerStatuses.middle_tester):
                return await self.get_active_buyers()

        if user.role in (RoleTypes.admin, RoleTypes.owner) or user.access == OrdersAccess.all:
            return await self.get_active_buyers()

        elif user.buyer_status == BuyerStatuses.senior:
            logins: list = await self.scalars_all(
                select(User.login).where(User.mentor == user.login)
            )
            return logins + [user.login]

        else:
            return [user.login]
