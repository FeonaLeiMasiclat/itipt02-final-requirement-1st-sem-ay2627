from sqlalchemy import text

from .auth import local_demo, password_hasher
from .database import engine


if __name__ == "__main__":
    if not local_demo:
        raise SystemExit("Set LIBRARY_LOCAL_DEMO=1 to create the local demo admin.")

    with engine.begin() as connection:
        existing_role = connection.execute(
            text("SELECT role FROM users WHERE username = 'admin' FOR UPDATE")
        ).scalar_one_or_none()
        if existing_role is None:
            connection.execute(text("""
                INSERT INTO users (username, full_name, role, password_hash)
                VALUES ('admin', 'admin', 'admin', :password_hash)
            """), {"password_hash": password_hasher.hash("admin")})
        elif existing_role != "admin":
            raise SystemExit("The admin username already belongs to a reader.")

    print("Local demo admin is ready.")
