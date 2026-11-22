from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_serializer
from sqlalchemy import text
from sqlalchemy.engine import Connection, RowMapping

from .auth import SignedInUser, User, require_admin
from .catalog import BookName, BookStatus
from .database import engine


router = APIRouter(prefix="/api", tags=["Borrowing"])
RequestStatus = Literal["Pending", "Approved", "Declined", "Return Pending", "Returned"]
# Read the latest record after waiting for the inventory lock on a retried action.
borrow_engine = engine.execution_options(isolation_level="READ COMMITTED")

request_details = """
    SELECT requests.id, requests.book_id AS bookId, requests.book_title AS bookTitle,
        requests.author, requests.kind, requests.status, users.full_name AS readerName,
        requests.requested_at AS requestedAt, requests.return_requested_at AS returnRequestedAt,
        requests.returned_at AS returnedAt,
        CASE WHEN requests.kind = 'Borrow'
            THEN requests.approved_at + INTERVAL 14 DAY END AS dueDate,
        books.status AS bookStatus, books.genre, books.copies AS availableCopies,
        books.price, books.rating, books.reviews, books.synopsis
    FROM borrow_requests AS requests
    JOIN users ON users.id = requests.user_id
    LEFT JOIN books ON books.id = requests.book_id
"""


class BorrowInput(BaseModel):
    bookId: Annotated[int, Field(gt=0)]


class AcquisitionInput(BaseModel):
    title: BookName
    author: BookName


class DecisionInput(BaseModel):
    status: Literal["Approved", "Declined"]


class BorrowRequest(BaseModel):
    id: int
    bookId: int | None
    bookTitle: str
    author: str
    kind: Literal["Borrow", "Acquisition"]
    status: RequestStatus
    readerName: str
    requestedAt: datetime
    returnRequestedAt: datetime | None
    returnedAt: datetime | None
    dueDate: datetime | None
    bookStatus: BookStatus | None
    genre: str | None
    availableCopies: int | None
    price: Decimal | None
    rating: Decimal | None
    reviews: int | None
    synopsis: str | None

    @field_serializer("requestedAt", "returnRequestedAt", "returnedAt", "dueDate")
    def serialize_utc(self, value: datetime | None) -> str | None:
        return value.replace(tzinfo=UTC).isoformat() if value is not None else None

    @field_serializer("price", "rating")
    def serialize_number(self, value: Decimal | None) -> float | None:
        return float(value) if value is not None else None


def require_reader(user: SignedInUser) -> User:
    if user.role != "reader":
        raise HTTPException(status_code=403, detail="A reader account is required.")
    return user


Reader = Annotated[User, Depends(require_reader)]


def request_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="This request could not be found.")


def load_request(connection: Connection, request_id: int) -> BorrowRequest:
    row = connection.execute(text(f"""
        {request_details} WHERE requests.id = :id
    """), {"id": request_id}).mappings().one()
    return BorrowRequest.model_validate(row)


def lock_book(connection: Connection, book_id: int | None) -> RowMapping | None:
    if book_id is None:
        return None
    return connection.execute(text("""
        SELECT id, title, author, status, copies, price FROM books WHERE id = :id FOR UPDATE
    """), {"id": book_id}).mappings().one_or_none()


def lock_request(
    connection: Connection, request_id: int, user_id: int | None = None,
) -> tuple[RowMapping, RowMapping | None]:
    row = connection.execute(text("""
        SELECT book_id, user_id FROM borrow_requests WHERE id = :id
    """), {"id": request_id}).mappings().one_or_none()
    if row is None or (user_id is not None and row["user_id"] != user_id):
        raise request_not_found()

    # Acquire inventory locks before request locks throughout borrowing and catalog deletion.
    book = lock_book(connection, row["book_id"])
    request = connection.execute(text("""
        SELECT status, kind FROM borrow_requests WHERE id = :id FOR UPDATE
    """), {"id": request_id}).mappings().one_or_none()
    if request is None:
        raise request_not_found()
    return request, book


@router.get("/borrow-requests")
def reader_requests(user: Reader) -> list[BorrowRequest]:
    with engine.connect() as connection:
        rows = connection.execute(text(f"""
            {request_details} WHERE requests.user_id = :user_id ORDER BY requests.id DESC
        """), {"user_id": user.id}).mappings().all()
    return [BorrowRequest.model_validate(row) for row in rows]


@router.get("/admin/borrow-requests", dependencies=[Depends(require_admin)])
def admin_requests() -> list[BorrowRequest]:
    with engine.connect() as connection:
        rows = connection.execute(text(f"{request_details} ORDER BY requests.id DESC")).mappings().all()
    return [BorrowRequest.model_validate(row) for row in rows]


@router.post("/borrow-requests", status_code=201)
def create_request(data: BorrowInput, user: Reader) -> BorrowRequest:
    with borrow_engine.begin() as connection:
        book = lock_book(connection, data.bookId)
        if book is None:
            raise HTTPException(status_code=404, detail="This book no longer exists.")
        if book["status"] != "Active":
            raise HTTPException(status_code=409, detail="This book is archived.")
        duplicate = connection.execute(text("""
            SELECT id FROM borrow_requests WHERE user_id = :user_id AND book_id = :book_id
                AND status IN ('Pending', 'Approved', 'Return Pending') LIMIT 1
        """), {"user_id": user.id, "book_id": data.bookId}).scalar_one_or_none()
        if duplicate is not None:
            raise HTTPException(status_code=409, detail="You already have an open request for this book.")

        result = connection.execute(text("""
            INSERT INTO borrow_requests (user_id, book_id, book_title, author)
            VALUES (:user_id, :book_id, :title, :author)
        """), {
            "user_id": user.id, "book_id": data.bookId,
            "title": book["title"], "author": book["author"],
        })
        return load_request(connection, result.lastrowid)


@router.post("/acquisition-requests", status_code=201)
def request_acquisition(data: AcquisitionInput, user: Reader) -> BorrowRequest:
    with borrow_engine.begin() as connection:
        connection.execute(text("SELECT id FROM users WHERE id = :id FOR UPDATE"), {"id": user.id})
        values = {**data.model_dump(), "user_id": user.id}
        duplicate = connection.execute(text("""
            SELECT id FROM borrow_requests WHERE user_id = :user_id AND kind = 'Acquisition'
                AND book_title = :title AND author = :author AND status = 'Pending'
            LIMIT 1
        """), values).scalar_one_or_none()
        if duplicate is not None:
            raise HTTPException(status_code=409, detail="This acquisition request is already pending.")
        result = connection.execute(text("""
            INSERT INTO borrow_requests (user_id, book_title, author, kind)
            VALUES (:user_id, :title, :author, 'Acquisition')
        """), values)
        return load_request(connection, result.lastrowid)


@router.patch("/admin/borrow-requests/{request_id}", dependencies=[Depends(require_admin)])
def decide_request(request_id: int, data: DecisionInput) -> BorrowRequest:
    with borrow_engine.begin() as connection:
        request, book = lock_request(connection, request_id)
        if request["status"] == data.status:
            return load_request(connection, request_id)
        if request["status"] != "Pending":
            raise HTTPException(status_code=409, detail="Only pending requests can be approved or declined.")

        if data.status == "Approved" and request["kind"] == "Borrow":
            if book is None or book["status"] != "Active" or book["copies"] <= 0:
                raise HTTPException(status_code=409, detail="No available copies. The request is still pending.")
            connection.execute(text("""
                UPDATE books SET copies = copies - 1, last_updated = UTC_DATE() WHERE id = :id
            """), {"id": book["id"]})

        connection.execute(text("""
            UPDATE borrow_requests SET status = :status,
                approved_at = CASE WHEN :status = 'Approved' THEN UTC_TIMESTAMP() ELSE NULL END
            WHERE id = :id
        """), {"id": request_id, "status": data.status})
        return load_request(connection, request_id)


@router.post("/borrow-requests/{request_id}/return")
def request_return(request_id: int, user: Reader) -> BorrowRequest:
    with borrow_engine.begin() as connection:
        request, book = lock_request(connection, request_id, user.id)
        if request["status"] in {"Return Pending", "Returned"}:
            return load_request(connection, request_id)
        if request["kind"] != "Borrow" or request["status"] != "Approved" or book is None:
            raise HTTPException(status_code=409, detail="Only an approved loan can be submitted for return.")

        connection.execute(text("""
            UPDATE borrow_requests SET status = 'Return Pending', return_requested_at = UTC_TIMESTAMP()
            WHERE id = :id
        """), {"id": request_id})
        return load_request(connection, request_id)


@router.post("/admin/borrow-requests/{request_id}/confirm-return", dependencies=[Depends(require_admin)])
def confirm_return(request_id: int) -> BorrowRequest:
    with borrow_engine.begin() as connection:
        request, book = lock_request(connection, request_id)
        if request["status"] == "Returned":
            return load_request(connection, request_id)
        if request["kind"] != "Borrow" or request["status"] != "Return Pending" or book is None:
            raise HTTPException(status_code=409, detail="The reader must request a return first.")
        if book["copies"] == 4_294_967_295:
            raise HTTPException(status_code=409, detail="Adjust the recorded stock before confirming the return.")

        connection.execute(text("""
            UPDATE books SET copies = copies + 1, last_updated = UTC_DATE() WHERE id = :id
        """), {"id": book["id"]})
        connection.execute(text("""
            UPDATE borrow_requests SET status = 'Returned', returned_at = UTC_TIMESTAMP()
            WHERE id = :id
        """), {"id": request_id})
        return load_request(connection, request_id)
