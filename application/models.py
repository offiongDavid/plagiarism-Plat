from sqlalchemy import Table, Column, Integer, String, DateTime
from .db import metadata
from datetime import datetime
import uuid

files = Table(
    "files",
    metadata,
    Column("id", String(82), primary_key=True, nullable=False),
    Column("filename", String(255), nullable=False),
    Column("filepath", String(255), nullable=False),
    Column("created_at", DateTime, nullable=False, default=datetime.now()),
    Column("updated_at", DateTime, nullable=False, default=datetime.now()),
    Column("userid", Integer, nullable=False),
    Column("category", String(36), nullable=False),
)