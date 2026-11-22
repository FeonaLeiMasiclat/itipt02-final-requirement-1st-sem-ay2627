from datetime import UTC, datetime
from decimal import Decimal
from hashlib import sha256
from json import dumps
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_serializer, model_validator
from sqlalchemy import text
from sqlalchemy.engine import Connection

from .auth import require_admin
from .borrowing import Reader, lock_book
from .catalog import BookStatus
from .database import engine


router = APIRouter(prefix="/api", tags=["Shop"])


class WishlistItem(BaseModel):
    id: int
    title: str
    price: Decimal

    @field_serializer("price")
    def serialize_price(self, value: Decimal) -> float:
        return float(value)


class CartItem(WishlistItem):
    author: str
    quantity: int
    availableCopies: int
    status: BookStatus


class OrderItem(WishlistItem):
    bookId: int | None
    author: str
    quantity: int


class Order(BaseModel):
    orderId: str
    buyerName: str
    date: datetime
    total: Decimal
    items: list[OrderItem]
    status: Literal["Awaiting Pickup"] = "Awaiting Pickup"
    paymentMethod: Literal["Counter Cash"] = "Counter Cash"

    @field_serializer("total")
    def serialize_total(self, value: Decimal) -> float:
        return float(value)

    @field_serializer("date")
    def serialize_date(self, value: datetime) -> str:
        return value.replace(tzinfo=UTC).isoformat()


class ShopState(BaseModel):
    cart: list[CartItem]
    wishlist: list[WishlistItem]
    orders: list[Order]


class OrderCustomer(BaseModel):
    id: int
    name: str
    username: str | None
    orderCount: int


class QuantityChange(BaseModel):
    delta: Literal[-1, 1]


class CheckoutItem(BaseModel):
    bookId: Annotated[int, Field(gt=0, le=18_446_744_073_709_551_615)]
    quantity: Annotated[int, Field(gt=0, le=4_294_967_295)]


class CheckoutInput(BaseModel):
    requestKey: UUID
    source: Literal["cart", "direct"]
    items: Annotated[list[CheckoutItem], Field(min_length=1)]

    @model_validator(mode="after")
    def check_items(self):
        if self.source == "direct" and len(self.items) != 1:
            raise ValueError("Buy Now checks out one title at a time")
        if len({item.bookId for item in self.items}) != len(self.items):
            raise ValueError("Each book can appear only once per checkout")
        return self


def lock_reader(connection: Connection, user_id: int) -> None:
    connection.execute(text("SELECT id FROM users WHERE id = :id FOR UPDATE"), {"id": user_id})


def cart_items(connection: Connection, user_id: int) -> list[CartItem]:
    rows = connection.execute(text("""
        SELECT books.id, books.title, books.author, books.price, books.copies AS availableCopies,
            books.status, cart.quantity
        FROM cart_items AS cart JOIN books ON books.id = cart.book_id
        WHERE cart.user_id = :user_id ORDER BY books.id
    """), {"user_id": user_id}).mappings()
    return [CartItem.model_validate(row) for row in rows]


def wishlist_items(connection: Connection, user_id: int) -> list[WishlistItem]:
    rows = connection.execute(text("""
        SELECT books.id, books.title, books.price
        FROM wishlist_items AS wishlist JOIN books ON books.id = wishlist.book_id
        WHERE wishlist.user_id = :user_id AND books.status = 'Active' ORDER BY books.id
    """), {"user_id": user_id}).mappings()
    return [WishlistItem.model_validate(row) for row in rows]


def orders(connection: Connection, user_id: int | None = None, order_id: int | None = None) -> list[Order]:
    rows = connection.execute(text("""
        SELECT orders.id AS orderKey, orders.placed_at, orders.total, users.full_name AS buyerName,
            items.id, items.book_id AS bookId, items.title, items.author, items.price, items.quantity
        FROM shop_orders AS orders JOIN users ON users.id = orders.user_id
        JOIN shop_order_items AS items ON items.order_id = orders.id
        WHERE (:user_id IS NULL OR orders.user_id = :user_id)
            AND (:order_id IS NULL OR orders.id = :order_id)
        ORDER BY orders.id DESC, items.id
    """), {"user_id": user_id, "order_id": order_id}).mappings()
    result: dict[int, Order] = {}
    for row in rows:
        key = row["orderKey"]
        if key not in result:
            result[key] = Order(
                orderId=f"LMS-{row['placed_at'].year}-{key:04d}", date=row["placed_at"],
                buyerName=row["buyerName"], total=row["total"], items=[],
            )
        result[key].items.append(OrderItem.model_validate(row))
    return list(result.values())


@router.get("/shop")
def reader_shop(user: Reader) -> ShopState:
    with engine.connect() as connection:
        return ShopState(
            cart=cart_items(connection, user.id), wishlist=wishlist_items(connection, user.id),
            orders=orders(connection, user_id=user.id),
        )


@router.get("/admin/orders", dependencies=[Depends(require_admin)])
def admin_orders(buyerId: Annotated[int | None, Query(gt=0)] = None) -> list[Order]:
    with engine.connect() as connection:
        return orders(connection, user_id=buyerId)


@router.get("/admin/order-customers", dependencies=[Depends(require_admin)])
def admin_order_customers() -> list[OrderCustomer]:
    with engine.connect() as connection:
        rows = connection.execute(text("""
            SELECT users.id, users.full_name AS name, users.username, COUNT(*) AS orderCount
            FROM shop_orders AS orders JOIN users ON users.id = orders.user_id
            GROUP BY users.id, users.full_name, users.username
            ORDER BY MAX(orders.id) DESC
        """)).mappings()
        return [OrderCustomer.model_validate(row) for row in rows]


@router.patch("/cart/{book_id}")
def change_cart(book_id: int, data: QuantityChange, user: Reader) -> list[CartItem]:
    keys = {"user_id": user.id, "book_id": book_id}
    with engine.begin() as connection:
        book = lock_book(connection, book_id)
        if book is None:
            raise HTTPException(status_code=404, detail="This book no longer exists.")
        lock_reader(connection, user.id)
        existing = connection.execute(text("""
            SELECT quantity FROM cart_items WHERE user_id = :user_id AND book_id = :book_id
        """), keys).scalar_one_or_none()
        if data.delta == -1 and existing is None:
            return cart_items(connection, user.id)
        quantity = max(1, (existing or 0) + data.delta)
        if data.delta == 1 and (book["status"] != "Active" or quantity > book["copies"]):
            raise HTTPException(status_code=409, detail="There are not enough available copies for your cart.")
        connection.execute(text("""
            INSERT INTO cart_items (user_id, book_id, quantity) VALUES (:user_id, :book_id, :quantity)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        """), {**keys, "quantity": quantity})
        return cart_items(connection, user.id)


@router.delete("/cart/{book_id}")
def remove_from_cart(book_id: int, user: Reader) -> list[CartItem]:
    with engine.begin() as connection:
        lock_reader(connection, user.id)
        connection.execute(text("""
            DELETE FROM cart_items WHERE user_id = :user_id AND book_id = :book_id
        """), {"user_id": user.id, "book_id": book_id})
        return cart_items(connection, user.id)


@router.put("/wishlist/{book_id}")
def add_to_wishlist(book_id: int, user: Reader) -> list[WishlistItem]:
    with engine.begin() as connection:
        book = lock_book(connection, book_id)
        if book is None or book["status"] != "Active":
            raise HTTPException(status_code=404, detail="This book is not available in the catalog.")
        lock_reader(connection, user.id)
        connection.execute(text("""
            INSERT INTO wishlist_items (user_id, book_id) VALUES (:user_id, :book_id)
            ON DUPLICATE KEY UPDATE book_id = VALUES(book_id)
        """), {"user_id": user.id, "book_id": book_id})
        return wishlist_items(connection, user.id)


@router.delete("/wishlist/{book_id}")
def remove_from_wishlist(book_id: int, user: Reader) -> list[WishlistItem]:
    with engine.begin() as connection:
        lock_reader(connection, user.id)
        connection.execute(text("""
            DELETE FROM wishlist_items WHERE user_id = :user_id AND book_id = :book_id
        """), {"user_id": user.id, "book_id": book_id})
        return wishlist_items(connection, user.id)


@router.post("/checkout")
def checkout(data: CheckoutInput, user: Reader) -> Order:
    quantities = {item.bookId: item.quantity for item in data.items}
    request_hash = sha256(dumps([data.source, sorted(quantities.items())]).encode()).hexdigest()
    with engine.begin() as connection:
        # Lock titles in a stable order before locking the reader, as loan requests do.
        locked = {book_id: lock_book(connection, book_id) for book_id in sorted(quantities)}
        lock_reader(connection, user.id)
        existing = connection.execute(text("""
            SELECT id, request_hash FROM shop_orders WHERE user_id = :user_id AND request_key = :request_key
        """), {"user_id": user.id, "request_key": str(data.requestKey)}).one_or_none()
        if existing:
            if existing.request_hash != request_hash:
                raise HTTPException(status_code=409, detail="This checkout reference belongs to another selection.")
            return orders(connection, user_id=user.id, order_id=existing.id)[0]

        lines = []
        total = Decimal("0.00")
        for book_id, quantity in quantities.items():
            book = locked[book_id]
            if book is None or book["status"] != "Active":
                raise HTTPException(status_code=409, detail="A selected title is no longer available.")
            if quantity > book["copies"]:
                raise HTTPException(status_code=409, detail=f"There are not enough available copies of {book['title']}.")
            if data.source == "cart":
                in_cart = connection.execute(text("""
                    SELECT quantity FROM cart_items WHERE user_id = :user_id AND book_id = :book_id
                """), {"user_id": user.id, "book_id": book_id}).scalar_one_or_none()
                if in_cart != quantity:
                    raise HTTPException(status_code=409, detail="Your cart changed. Review it before checking out again.")
            lines.append({
                "book_id": book_id, "title": book["title"], "author": book["author"],
                "price": book["price"], "quantity": quantity,
            })
            total += book["price"] * quantity

        result = connection.execute(text("""
            INSERT INTO shop_orders (user_id, request_key, request_hash, total)
            VALUES (:user_id, :request_key, :request_hash, :total)
        """), {
            "user_id": user.id, "request_key": str(data.requestKey), "request_hash": request_hash, "total": total,
        })
        order_id = result.lastrowid
        for line in lines:
            connection.execute(text("""
                INSERT INTO shop_order_items (order_id, book_id, title, author, price, quantity)
                VALUES (:order_id, :book_id, :title, :author, :price, :quantity)
            """), {**line, "order_id": order_id})
            connection.execute(text("""
                UPDATE books SET copies = copies - :quantity, last_updated = UTC_DATE() WHERE id = :book_id
            """), line)
            if data.source == "cart":
                connection.execute(text("""
                    DELETE FROM cart_items WHERE user_id = :user_id AND book_id = :book_id
                """), {"user_id": user.id, "book_id": line["book_id"]})
        return orders(connection, user_id=user.id, order_id=order_id)[0]
