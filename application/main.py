"""main.py
Python FastAPI Auth0 integration example
"""
from fastapi.responses import JSONResponse
from datetime import datetime
from fastapi import FastAPI, Depends, Security, UploadFile, File, Form
from fastapi.security import HTTPBearer 
from .utils import VerifyToken
from .db import database, metadata, DATABASE_URL
from sqlalchemy import create_engine
from .models import files
app = FastAPI()
import uuid
import os
import shutil
engine = create_engine(DATABASE_URL)
metadata.create_all(engine)

ASSIGNMENT_DIR = "assignment_dir"
THESIS_DIR = "thesis_dir"
RESEARCH_DIR = "research_dir"
OTHER_DIR = "other_dir"

DIRS = ("assignment_dir", "thesis_dir", "research_dir", "other_dir")

VALID_CATEGORIES = (
    "assignment",
    "thesis",
    "research",
    "other",
)



@app.post("/api/upload-document/{userid}")
async def upload_pdf(userid: int, file: UploadFile = File(...), category: str = Form(...)):
    if category not in VALID_CATEGORIES:
        return JSONResponse(status_code=400, content={"status": 400, "detail": "invalid category"})
    elif category == "assignment":
        filename = str(uuid.uuid4()) + ".pdf"
        file_location  = os.path.join(ASSIGNMENT_DIR, filename)
        query = files.insert().values(id=str(uuid.uuid4()), filepath=file_location, filename=file.filename, userid=userid, category=category, created_at=datetime.now(), updated_at=datetime.now())
        await database.execute(query)
    elif category == "thesis":
        filename = str(uuid.uuid4()) + ".pdf"
        file_location = os.path.join(THESIS_DIR, filename)
        query = files.insert().values(id=str(uuid.uuid4),filepath=file_location, filename=file.filename, userid=userid ,category=category, created_at=datetime.now(), updated_at=datetime.now())
        await database.execute(query)
    elif category == "research":
        filename = str(uuid.uuid4()) + ".pdf"
        file_location = os.path.join(RESEARCH_DIR, filename)
        query = files.insert().values(id=str(uuid.uuid4), filepath=file_location, filename=file.filename, userid=userid, category=category, created_at=datetime.now(), updated_at=datetime.now())
        await database.execute(query)
    elif category == "other":
        filename = str(uuid.uuid4()) + ".pdf"
        file_location = os.join(OTHER_DIR, filename)
        query = files.insert().values(id=str(uuid.uuid4), filepath=file_location, filename=file.filename, userid=userid, category=category, created_at=datetime.now(), updated_at=datetime.now())
        await database.execute(query)
    with open(file_location, "wb") as f:
        print("writing file")
        shutil.copyfileobj(file.file, f)
        return JSONResponse(status_code=200, content={"status": 200, "detail": "file uploaded successfully"})
        
@app.on_event("startup")
async def startup():
    for dirs in DIRS:
        if not os.path.exists(dirs):
            os.makedirs(dirs)
    await database.connect()
    print("conected to database")

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    print("disconnected from database")

