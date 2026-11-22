from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .auth import router as auth_router
from .borrowing import router as borrowing_router
from .catalog import router as catalog_router
from .database import engine
from .shop import router as shop_router


app = FastAPI(title="Headquarters Library API")
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(borrowing_router)
app.include_router(shop_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT id FROM users LIMIT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(status_code=503, detail="Library database is unavailable") from error

    return {"status": "ok", "database": "connected"}
