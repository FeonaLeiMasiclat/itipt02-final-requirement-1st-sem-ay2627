from os import getenv
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine


load_dotenv(Path(__file__).with_name(".env"))

database_url = URL.create(
    "mysql+pymysql",
    host=getenv("LIBRARY_DB_HOST", "127.0.0.1"),
    port=int(getenv("LIBRARY_DB_PORT", "3306")),
    database=getenv("LIBRARY_DB_NAME", "headquarters_library"),
    username=getenv("LIBRARY_DB_USER", "root"),
    password=getenv("LIBRARY_DB_PASSWORD", ""),
    query={"charset": "utf8mb4"},
)

engine = create_engine(database_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
