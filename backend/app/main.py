from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .api import checklist, files
from . import models
from .database import engine
from .middleware import SharedChecklistMiddleware

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Checklist Builder API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add shared checklist middleware to protect edit operations
app.add_middleware(SharedChecklistMiddleware)

# Include API routers
app.include_router(checklist.router, tags=["checklists"])
app.include_router(files.router, tags=["files"])

# Serve static files (uploads)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Checklist Builder API", "docs": "/docs"}
