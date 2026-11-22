from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, StringConstraints, field_serializer
from sqlalchemy import text
from sqlalchemy.engine import Connection

from .auth import SignedInUser, require_admin
from .database import engine


router = APIRouter(prefix="/api", tags=["Catalog"])
admin_only = [Depends(require_admin)]

BookName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
BookStatus = Literal["Active", "Archived"]
BookGenre = Literal["Romance", "Horror", "Sci-fi", "Comedy", "Mythology"]

book_columns = """
    id, title, author, genre, copies, price, rating, reviews, synopsis, status,
    last_updated AS lastUpdated, isbn, source_url AS sourceUrl
"""


class BookInput(BaseModel):
    title: BookName
    author: BookName
    genre: BookGenre
    copies: Annotated[int, Field(ge=0, le=4_294_967_295)]
    price: Annotated[Decimal, Field(ge=0, max_digits=10, decimal_places=2)]
    rating: Annotated[Decimal, Field(ge=0, le=5, decimal_places=2)]
    reviews: Annotated[int, Field(ge=0, le=4_294_967_295)]
    synopsis: Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)] = ""


class BookEditInput(BookInput):
    expectedCopies: Annotated[int, Field(ge=0, le=4_294_967_295)] | None = None


class Book(BookInput):
    id: int
    status: BookStatus
    lastUpdated: date
    isbn: str | None
    sourceUrl: str | None

    @field_serializer("price", "rating")
    def serialize_number(self, value: Decimal) -> float:
        return float(value)


class StatusUpdate(BaseModel):
    status: BookStatus


def list_books(include_archived: bool) -> list[Book]:
    status_filter = "" if include_archived else "WHERE status = 'Active'"
    with engine.connect() as connection:
        rows = connection.execute(text(f"""
            SELECT {book_columns} FROM books {status_filter}
            ORDER BY catalog_order IS NULL, catalog_order, id
        """)).mappings().all()
    return [Book.model_validate(row) for row in rows]


def load_book(connection: Connection, book_id: int) -> Book:
    row = connection.execute(text(f"""
        SELECT {book_columns} FROM books WHERE id = :id
    """), {"id": book_id}).mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="This book no longer exists.")
    return Book.model_validate(row)


@router.get("/books")
def reader_catalog(user: SignedInUser) -> list[Book]:
    return list_books(include_archived=False)


@router.get("/admin/books", dependencies=admin_only)
def admin_catalog() -> list[Book]:
    return list_books(include_archived=True)


@router.post("/admin/books", status_code=201, dependencies=admin_only)
def create_book(data: BookInput) -> Book:
    with engine.begin() as connection:
        result = connection.execute(text("""
            INSERT INTO books (title, author, genre, copies, price, rating, reviews, synopsis)
            VALUES (:title, :author, :genre, :copies, :price, :rating, :reviews, :synopsis)
        """), data.model_dump())
        return load_book(connection, result.lastrowid)


@router.put("/admin/books/{book_id}", dependencies=admin_only)
def edit_book(book_id: int, data: BookEditInput) -> Book:
    values = data.model_dump(exclude={"expectedCopies"})
    with engine.begin() as connection:
        if data.expectedCopies is not None:
            copies = connection.execute(
                text("SELECT copies FROM books WHERE id = :id FOR UPDATE"), {"id": book_id},
            ).scalar_one_or_none()
            if copies is None:
                raise HTTPException(status_code=404, detail="This book no longer exists.")
            if data.copies == data.expectedCopies:
                values["copies"] = copies
            elif copies != data.expectedCopies:
                raise HTTPException(status_code=409, detail="Stock changed while you were editing. Reopen the book and try again.")

        connection.execute(text("""
            UPDATE books SET title = :title, author = :author, genre = :genre, copies = :copies,
                price = :price, rating = :rating, reviews = :reviews, synopsis = :synopsis,
                last_updated = UTC_DATE()
            WHERE id = :id
        """), {**values, "id": book_id})
        return load_book(connection, book_id)


@router.patch("/admin/books/{book_id}/status", dependencies=admin_only)
def change_status(book_id: int, data: StatusUpdate) -> Book:
    with engine.begin() as connection:
        connection.execute(text("""
            UPDATE books SET last_updated = IF(status = :status, last_updated, UTC_DATE()),
                status = :status
            WHERE id = :id
        """), {"id": book_id, "status": data.status})
        return load_book(connection, book_id)


@router.delete("/admin/books/{book_id}", status_code=204, dependencies=admin_only)
def delete_book(book_id: int) -> Response:
    with engine.begin() as connection:
        status = connection.execute(text("""
            SELECT status FROM books WHERE id = :id FOR UPDATE
        """), {"id": book_id}).scalar_one_or_none()
        if status is None:
            raise HTTPException(status_code=404, detail="This book no longer exists.")
        if status != "Archived":
            raise HTTPException(status_code=409, detail="Archive this book before deleting it.")
        open_request = connection.execute(text("""
            SELECT id FROM borrow_requests WHERE book_id = :id
                AND status IN ('Pending', 'Approved', 'Return Pending')
            LIMIT 1 FOR UPDATE
        """), {"id": book_id}).scalar_one_or_none()
        if open_request is not None:
            raise HTTPException(status_code=409, detail="Resolve pending requests and returns before deleting this book.")
        connection.execute(text("DELETE FROM books WHERE id = :id"), {"id": book_id})
    return Response(status_code=204)
