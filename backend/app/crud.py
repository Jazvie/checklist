from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from typing import List, Optional
from . import models, schemas


# Checklist operations
def get_checklist(db: Session, checklist_id: int):
    """Get a checklist by ID"""
    return db.query(models.Checklist).filter(models.Checklist.id == checklist_id).first()


def get_checklist_by_public_link(db: Session, public_link: str):
    """Get a checklist by its public link"""
    return db.query(models.Checklist).filter(models.Checklist.public_link == public_link).first()


def get_checklist_by_edit_token(db: Session, edit_token: str):
    """Get a checklist by its edit token"""
    return db.query(models.Checklist).filter(models.Checklist.edit_token == edit_token).first()


def get_checklists(db: Session, skip: int = 0, limit: int = 100):
    """Get all checklists with pagination"""
    return db.query(models.Checklist).offset(skip).limit(limit).all()


def create_checklist(db: Session, checklist: schemas.ChecklistCreate):
    """Create a new checklist with categories and items"""
    # Generate a unique public link and edit token
    public_link = str(uuid.uuid4())
    edit_token = str(uuid.uuid4())
    
    # Create the checklist
    db_checklist = models.Checklist(
        title=checklist.title,
        description=checklist.description,
        public_link=public_link,
        edit_token=edit_token,
        created_at=datetime.utcnow()
    )
    db.add(db_checklist)
    db.commit()
    db.refresh(db_checklist)
    
    # Create categories and items
    for category_data in checklist.categories:
        create_category(db, category_data, db_checklist.id)
    
    return db_checklist


def update_checklist(db: Session, checklist_id: int, checklist: schemas.ChecklistUpdate):
    """Update a checklist's basic information"""
    db_checklist = get_checklist(db, checklist_id)
    if db_checklist:
        # Update basic checklist info
        db_checklist.title = checklist.title
        if checklist.description is not None:
            db_checklist.description = checklist.description
        
        # Handle categories if provided
        if checklist.categories is not None:
            # Remove existing categories (cascade will remove items)
            db.query(models.Category).filter(models.Category.checklist_id == checklist_id).delete()
            db.commit()
            
            # Create new categories and items
            for category_data in checklist.categories:
                create_category(db, category_data, checklist_id)
        
        db.commit()
        db.refresh(db_checklist)
        return db_checklist
    return None


def delete_checklist(db: Session, checklist_id: int):
    """Delete a checklist and all its categories, items, and file uploads"""
    db_checklist = get_checklist(db, checklist_id)
    if db_checklist:
        db.delete(db_checklist)
        db.commit()
        return True
    return False


def clone_checklist(db: Session, checklist_id: int, new_title: Optional[str] = None):
    """Clone an existing checklist with all its categories and items"""
    # Get the original checklist
    original = get_checklist(db, checklist_id=checklist_id)
    if not original:
        return None
    
    # Create a new checklist with a new public link and edit token
    clone = models.Checklist(
        title=new_title or f"Copy of {original.title}",
        description=original.description,
        public_link=str(uuid.uuid4()),
        edit_token=str(uuid.uuid4()),
        created_at=datetime.utcnow()
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    
    # Clone all categories and items
    for category in original.categories:
        db_category = models.Category(
            name=category.name,
            checklist_id=clone.id
        )
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        
        # Clone items within the category
        for item in category.items:
            db_item = models.Item(
                name=item.name,
                allow_multiple_files=item.allow_multiple_files,
                category_id=db_category.id
            )
            db.add(db_item)
        
        db.commit()
    
    return clone


# Category operations
def get_category(db: Session, category_id: int):
    """Get a category by ID"""
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def create_category(db: Session, category: schemas.CategoryCreate, checklist_id: int):
    """Create a new category with items"""
    db_category = models.Category(
        name=category.name,
        checklist_id=checklist_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    # Create items
    for item_data in category.items:
        create_item(db, item_data, db_category.id)
    
    return db_category


def update_category(db: Session, category_id: int, category: schemas.CategoryUpdate):
    """Update a category's information"""
    db_category = get_category(db, category_id)
    if db_category:
        db_category.name = category.name
        
        # Handle items if provided
        if category.items is not None:
            # Remove existing items (cascade will remove file uploads)
            db.query(models.Item).filter(models.Item.category_id == category_id).delete()
            db.commit()
            
            # Create new items
            for item_data in category.items:
                create_item(db, item_data, category_id)
        
        db.commit()
        db.refresh(db_category)
        return db_category
    return None


def delete_category(db: Session, category_id: int):
    """Delete a category and all its items and file uploads"""
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False


# Item operations
def get_item(db: Session, item_id: int):
    """Get an item by ID"""
    return db.query(models.Item).filter(models.Item.id == item_id).first()


def create_item(db: Session, item: schemas.ItemCreate, category_id: int):
    """Create a new item"""
    db_item = models.Item(
        name=item.name,
        allow_multiple_files=item.allow_multiple_files,
        category_id=category_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_item(db: Session, item_id: int, item: schemas.ItemUpdate):
    """Update an item's information"""
    db_item = get_item(db, item_id)
    if db_item:
        db_item.name = item.name
        db_item.allow_multiple_files = item.allow_multiple_files
        db.commit()
        db.refresh(db_item)
        return db_item
    return None


def delete_item(db: Session, item_id: int):
    """Delete an item and all its file uploads"""
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False


# File upload operations
def get_file_upload(db: Session, file_id: int):
    """Get a file upload by ID"""
    return db.query(models.FileUpload).filter(models.FileUpload.id == file_id).first()


def get_file_uploads_by_item(db: Session, item_id: int):
    """Get all file uploads for an item"""
    return db.query(models.FileUpload).filter(models.FileUpload.item_id == item_id).all()


def create_file_upload(db: Session, file_upload: schemas.FileUploadCreate, item_id: int):
    """Create a new file upload record"""
    db_file = models.FileUpload(
        filename=file_upload.filename,
        uploaded_at=datetime.utcnow(),
        uploader=file_upload.uploader,
        item_id=item_id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def delete_file_upload(db: Session, file_id: int):
    """Delete a file upload record"""
    db_file = get_file_upload(db, file_id)
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False
