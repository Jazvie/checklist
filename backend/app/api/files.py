import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, database

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/items/{item_id}/uploads/", response_model=schemas.FileUpload, status_code=status.HTTP_201_CREATED)
async def upload_file(item_id: int, file: UploadFile = File(...), uploader: Optional[str] = Form(None), db: Session = Depends(get_db)):
    """Upload a file for a specific checklist item"""
    # Check if item exists
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if multiple files are allowed for this item
    if not db_item.allow_multiple_files:
        # If multiple files are not allowed, check if there are already uploads
        existing_uploads = crud.get_file_uploads_by_item(db, item_id=item_id)
        if existing_uploads:
            raise HTTPException(
                status_code=400, 
                detail="This item does not allow multiple file uploads. Delete the existing file first."
            )
    
    # Validate file type (suggested: .txt, .pdf, .xlsx)
    filename = file.filename
    file_extension = os.path.splitext(filename)[1].lower()
    suggested_extensions = [".txt", ".pdf", ".xlsx"]
    
    if file_extension not in suggested_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not recommended. Suggested file types are: {', '.join(suggested_extensions)}"
        )
    
    # Check file size (suggested limit: 10MB)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    
    # Read file content to check size
    contents = await file.read(MAX_SIZE + 1)  # Read slightly more to check if it exceeds
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Suggested maximum size is 10MB."
        )
    
    # Reset file pointer after reading
    await file.seek(0)
    
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{item_id}_{filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)  # Write the content we already read
    finally:
        file.file.close()
    
    # Create file upload record in database
    file_upload = schemas.FileUploadCreate(
        filename=filename,
        uploader=uploader
    )
    
    return crud.create_file_upload(db=db, file_upload=file_upload, item_id=item_id)


@router.get("/items/{item_id}/uploads/", response_model=List[schemas.FileUpload])
def read_file_uploads(item_id: int, db: Session = Depends(get_db)):
    """Get all file uploads for a specific item"""
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return crud.get_file_uploads_by_item(db, item_id=item_id)


@router.get("/uploads/{file_id}", response_model=schemas.FileUpload)
def read_file_upload(file_id: int, db: Session = Depends(get_db)):
    """Get a specific file upload by ID"""
    db_file = crud.get_file_upload(db, file_id=file_id)
    if db_file is None:
        raise HTTPException(status_code=404, detail="File upload not found")
    
    return db_file


@router.delete("/uploads/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_upload(file_id: int, db: Session = Depends(get_db)):
    """Delete a file upload"""
    db_file = crud.get_file_upload(db, file_id=file_id)
    if db_file is None:
        raise HTTPException(status_code=404, detail="File upload not found")
    
    # Delete file from disk
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{db_file.item_id}_{db_file.filename}")
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        # Log the error but continue with database deletion
        print(f"Error deleting file: {e}")
    
    # Delete record from database
    success = crud.delete_file_upload(db, file_id=file_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file upload record")
    
    return {"ok": True}
