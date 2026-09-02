import uuid
from datetime import datetime, date

from sqlalchemy import func, BigInteger, DateTime, Boolean, DECIMAL, Date, String
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped

from sqlalchemy.dialects.postgresql import UUID, ENUM, ARRAY

from app.utils.enums import VariableTypes, OrdersAccess, RoleTypes, BuyerStatuses, OfferTypes, LaunchSources
from app.utils.generate_password import generate_password


class Base(DeclarativeBase):
    pass


class Order(Base):
    __tablename__ = 'orders'

    number: Mapped[str] = mapped_column(primary_key=True)
    offer_id: Mapped[str | None] = mapped_column()
    buyer_id: Mapped[str | None] = mapped_column()
    status: Mapped[str] = mapped_column()
    type: Mapped[str | None] = mapped_column()
    site: Mapped[str | None] = mapped_column()
    source: Mapped[str | None] = mapped_column()
    medium: Mapped[str | None] = mapped_column()
    campaign: Mapped[str | None] = mapped_column()
    keyword: Mapped[str | None] = mapped_column()
    content: Mapped[str | None] = mapped_column()
    method: Mapped[str | None] = mapped_column()
    price: Mapped[float] = mapped_column(DECIMAL(11, 2), server_default='0')
    price_clear: Mapped[float] = mapped_column(DECIMAL(11, 2), server_default='0')
    price_clear_old: Mapped[float] = mapped_column(DECIMAL(11, 2), server_default='0')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class User(Base):
    __tablename__ = 'users'

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    login: Mapped[str] = mapped_column()
    name: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column(default=generate_password)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default='0')
    role: Mapped[RoleTypes] = mapped_column(ENUM(RoleTypes), default=RoleTypes.buyer, server_default='buyer')
    access: Mapped[OrdersAccess] = mapped_column(ENUM(OrdersAccess), default=OrdersAccess.personal, server_default='personal')
    offers_access: Mapped[bool] = mapped_column(Boolean, default=False, server_default='0')
    buyer_status: Mapped[BuyerStatuses] = mapped_column(ENUM(BuyerStatuses), default=BuyerStatuses.middle, server_default='middle')
    mentor: Mapped[str | None] = mapped_column()
    telegram_user_id: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    def json(self, with_full: bool = False) -> dict:
        if with_full:
            return {
                "login": self.login,
                "password": self.password,
                "is_active": self.is_active,
                "access": self.access.value,
                "buyer_status": self.buyer_status.name,
                "mentor": self.mentor,
                "offers_access": self.offers_access,
            }

        else:
            return {
                "login": self.login,
                "role": self.role.name if self.buyer_status not in (BuyerStatuses.tester, BuyerStatuses.middle_tester) else self.buyer_status.name,
                "access": self.access.name,
                "offers_access": self.offers_access,
                "buyer_status": self.buyer_status.name,
                "mentor": self.mentor,
                "telegram_user_id": self.telegram_user_id
            }


class Insight(Base):
    __tablename__ = 'insights'

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    type: Mapped[str | None] = mapped_column()
    offer_id: Mapped[str] = mapped_column()
    buyer_id: Mapped[str] = mapped_column(server_default='default')
    country: Mapped[str | None] = mapped_column()
    offer_type: Mapped[OfferTypes | None] = mapped_column(ENUM(OfferTypes), nullable=True)
    site_type: Mapped[str | None] = mapped_column()
    goal_type: Mapped[str | None] = mapped_column()
    site_language: Mapped[str | None] = mapped_column()
    launch_type: Mapped[str | None] = mapped_column()
    campaign_goal: Mapped[str | None] = mapped_column()
    price_type: Mapped[str | None] = mapped_column()
    source: Mapped[str | None] = mapped_column()
    launch_source: Mapped[LaunchSources] = mapped_column(
        ENUM(LaunchSources),
        default=LaunchSources.internal,
        server_default=LaunchSources.internal.name,
    )
    medium: Mapped[str | None] = mapped_column()
    campaign: Mapped[str | None] = mapped_column()
    keyword: Mapped[str | None] = mapped_column()
    content: Mapped[str | None] = mapped_column()
    spend: Mapped[float] = mapped_column(DECIMAL(7, 2))
    sell_price: Mapped[float] = mapped_column(DECIMAL(11, 2), server_default='0')
    conversion: Mapped[int] = mapped_column()
    link_clicks: Mapped[int] = mapped_column(server_default="0")
    day: Mapped[date] = mapped_column(Date())


class Variable(Base):
    __tablename__ = 'variables'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[VariableTypes] = mapped_column(ENUM(VariableTypes))
    value: Mapped[float | None] = mapped_column(DECIMAL(14, 7))
    list_value: Mapped[list[str] | None] = mapped_column(MutableList.as_mutable(ARRAY(String)))
    buyer_id: Mapped[str | None] = mapped_column()
    date: Mapped[Date | None] = mapped_column(Date)
