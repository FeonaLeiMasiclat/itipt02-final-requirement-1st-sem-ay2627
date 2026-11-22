from datetime import UTC, date, datetime, timedelta
from hashlib import sha256
from hmac import compare_digest
from os import getenv
from secrets import token_urlsafe
from typing import Annotated, Literal

import jwt
from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from .database import engine


router = APIRouter(prefix="/api", tags=["Accounts"])
password_hasher = PasswordHash.recommended()
dummy_hash = password_hasher.hash(token_urlsafe(32))
local_demo = getenv("LIBRARY_LOCAL_DEMO") == "1"
token_secret = getenv("LIBRARY_AUTH_SECRET") or token_urlsafe(48)
bearer_scheme = HTTPBearer(auto_error=False)
access_token_lifetime = timedelta(minutes=30)
invalid_login = "Invalid email, username, or password."

profile_columns = """
    users.id, users.username, users.role, users.email, users.address,
    users.full_name AS fullName, users.date_of_birth AS dateOfBirth
"""
NewPassword = Annotated[str, Field(min_length=6, max_length=128)]


class User(BaseModel):
    id: int
    username: str | None
    role: Literal["reader", "admin"]
    fullName: str
    dateOfBirth: date | None
    address: str | None
    email: EmailStr | None


class EmailInput(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class ProfileInput(EmailInput):
    fullName: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
    dateOfBirth: date
    address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]

    @field_validator("dateOfBirth")
    @classmethod
    def check_birth_date(cls, value: date) -> date:
        if value >= date.today():
            raise ValueError("Date of birth must be in the past")
        return value


class RegisterInput(ProfileInput):
    username: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=3, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$"),
    ]
    password: NewPassword

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.lower()


class LoginInput(BaseModel):
    username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=254)]
    password: Annotated[str, Field(min_length=1, max_length=128)]


class ResetInput(BaseModel):
    token: Annotated[str, Field(min_length=1, max_length=128)]
    password: NewPassword


class LoginResult(BaseModel):
    token: str
    user: User


class DemoMessage(BaseModel):
    email: EmailStr
    token: str


class ForgotPasswordResult(BaseModel):
    message: str
    mail: DemoMessage | None


def token_hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def require_local_demo(request: Request) -> None:
    if not local_demo or not request.client or request.client.host not in {"127.0.0.1", "::1"}:
        raise HTTPException(status_code=404, detail="The simulated inbox is available in local demo mode.")
    if request.url.hostname not in {"127.0.0.1", "::1", "localhost"}:
        raise HTTPException(status_code=404, detail="The simulated inbox is available on localhost.")


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    response: Response,
) -> User:
    response.headers["Cache-Control"] = "no-store"
    unauthorized = HTTPException(
        status_code=401, detail="Please sign in.", headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        claims = jwt.decode(
            credentials.credentials, token_secret, algorithms=["HS256"],
            options={"require": ["sub", "exp", "password_version"]},
        )
        user_id = int(claims["sub"])
    except (jwt.InvalidTokenError, TypeError, ValueError) as error:
        raise unauthorized from error

    with engine.connect() as connection:
        row = connection.execute(text(f"""
            SELECT {profile_columns}, users.password_hash FROM users WHERE id = :id
        """), {"id": user_id}).mappings().one_or_none()
    # Password changes invalidate issued tokens without storing per-login state.
    if not row or not compare_digest(token_hash(row["password_hash"]), claims["password_version"]):
        raise unauthorized
    return User.model_validate(row)


SignedInUser = Annotated[User, Depends(current_user)]


def require_admin(user: SignedInUser) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return user


@router.post("/register", status_code=201)
def register(data: RegisterInput) -> dict[str, str]:
    values = data.model_dump(exclude={"password"})
    values["password_hash"] = password_hasher.hash(data.password)
    try:
        with engine.begin() as connection:
            connection.execute(text("""
                INSERT INTO users (username, full_name, date_of_birth, address, email, password_hash)
                VALUES (:username, :fullName, :dateOfBirth, :address, :email, :password_hash)
            """), values)
    except IntegrityError as error:
        if error.orig.args[0] != 1062:
            raise
        with engine.connect() as connection:
            username_taken = connection.execute(
                text("SELECT 1 FROM users WHERE username = :username"), {"username": data.username},
            ).scalar_one_or_none()
        field = "username" if username_taken else "email address"
        raise HTTPException(status_code=409, detail=f"That {field} is already registered.") from error
    return {"message": "Account created successfully."}


@router.post("/login")
def login(data: LoginInput, response: Response) -> LoginResult:
    identifier = data.username.lower()
    login_field = "email" if "@" in identifier else "username"
    if login_field == "email":
        try:
            identifier = validate_email(identifier, check_deliverability=False).normalized.lower()
        except EmailNotValidError as error:
            raise HTTPException(status_code=401, detail=invalid_login) from error

    with engine.connect() as connection:
        row = connection.execute(text(f"""
            SELECT {profile_columns}, users.password_hash FROM users
            WHERE {login_field} = :identifier
        """), {"identifier": identifier}).mappings().one_or_none()
    valid_password = password_hasher.verify(
        data.password, row["password_hash"] if row else dummy_hash,
    )
    if not row or not valid_password:
        raise HTTPException(status_code=401, detail=invalid_login)

    token = jwt.encode({
        "sub": str(row["id"]),
        "exp": datetime.now(UTC) + access_token_lifetime,
        "password_version": token_hash(row["password_hash"]),
    }, token_secret, algorithm="HS256")
    response.headers["Cache-Control"] = "no-store"
    return LoginResult(token=token, user=User.model_validate(row))


@router.get("/me")
def me(user: SignedInUser) -> User:
    return user


@router.get("/admin/me")
def admin_me(user: Annotated[User, Depends(require_admin)]) -> User:
    return user


@router.patch("/me")
def update_profile(data: ProfileInput, user: SignedInUser) -> User:
    values = data.model_dump()
    try:
        with engine.begin() as connection:
            previous_email = connection.execute(
                text("SELECT email FROM users WHERE id = :id FOR UPDATE"), {"id": user.id},
            ).scalar_one()
            connection.execute(text("""
                UPDATE users SET full_name = :fullName, date_of_birth = :dateOfBirth,
                    address = :address, email = :email
                WHERE id = :id
            """), {**values, "id": user.id})
            if previous_email != data.email:
                connection.execute(text("DELETE FROM password_resets WHERE user_id = :id"),
                                   {"id": user.id})
    except IntegrityError as error:
        if error.orig.args[0] != 1062:
            raise
        raise HTTPException(status_code=409, detail="That email address is already registered.") from error
    return user.model_copy(update=values)


@router.post("/forgot-password", status_code=202, dependencies=[Depends(require_local_demo)])
def forgot_password(data: EmailInput, response: Response) -> ForgotPasswordResult:
    token = token_urlsafe(32)
    with engine.begin() as connection:
        user_id = connection.execute(
            text("SELECT id FROM users WHERE email = :email FOR UPDATE"),
            {"email": data.email},
        ).scalar_one_or_none()
        if user_id is not None:
            connection.execute(text("DELETE FROM password_resets WHERE user_id = :user_id"),
                               {"user_id": user_id})
            connection.execute(text("""
                INSERT INTO password_resets (user_id, token_hash, expires_at)
                VALUES (:user_id, :token_hash, UTC_TIMESTAMP() + INTERVAL 20 MINUTE)
            """), {"user_id": user_id, "token_hash": token_hash(token)})
    response.headers["Cache-Control"] = "no-store"
    return ForgotPasswordResult(
        message="Check the simulated inbox for a reset link.",
        mail=DemoMessage(email=data.email, token=token) if user_id is not None else None,
    )


@router.post("/reset-password", dependencies=[Depends(require_local_demo)])
def reset_password(data: ResetInput) -> dict[str, str]:
    digest = token_hash(data.token)
    invalid_link = HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    with engine.begin() as connection:
        user_id = connection.execute(text("""
            SELECT user_id FROM password_resets
            WHERE token_hash = :token_hash AND expires_at > UTC_TIMESTAMP()
        """), {"token_hash": digest}).scalar_one_or_none()
        if user_id is None:
            raise invalid_link
        connection.execute(text("SELECT id FROM users WHERE id = :id FOR UPDATE"), {"id": user_id})
        consumed = connection.execute(text("""
            DELETE FROM password_resets
            WHERE token_hash = :token_hash AND expires_at > UTC_TIMESTAMP()
        """), {"token_hash": digest})
        if consumed.rowcount != 1:
            raise invalid_link

        connection.execute(text("UPDATE users SET password_hash = :password_hash WHERE id = :id"),
                           {"id": user_id, "password_hash": password_hasher.hash(data.password)})
    return {"message": "Password updated. You can now sign in."}
