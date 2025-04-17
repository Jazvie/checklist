from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, database

router = APIRouter()


# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/checklists/", response_model=List[schemas.Checklist])
def read_checklists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all checklists"""
    checklists = crud.get_checklists(db, skip=skip, limit=limit)
    return checklists


@router.post("/checklists/", response_model=schemas.Checklist, status_code=status.HTTP_201_CREATED)
def create_checklist(checklist: schemas.ChecklistCreate, db: Session = Depends(get_db)):
    """Create a new checklist"""
    return crud.create_checklist(db=db, checklist=checklist)


@router.get("/checklists/{checklist_id}", response_model=schemas.Checklist)
def read_checklist(checklist_id: int, db: Session = Depends(get_db)):
    """Get a specific checklist by ID"""
    db_checklist = crud.get_checklist(db, checklist_id=checklist_id)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return db_checklist


@router.get("/checklists/public/{public_link}", response_model=schemas.Checklist)
def read_checklist_by_public_link(public_link: str, db: Session = Depends(get_db)):
    """Get a checklist by its public link (read-only access with file upload permission)"""
    db_checklist = crud.get_checklist_by_public_link(db, public_link=public_link)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return db_checklist


@router.get("/checklists/edit/{edit_token}", response_model=schemas.Checklist)
def read_checklist_by_edit_token(edit_token: str, db: Session = Depends(get_db)):
    """Get a checklist by its edit token (full edit access)"""
    db_checklist = crud.get_checklist_by_edit_token(db, edit_token=edit_token)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return db_checklist


@router.put("/checklists/{checklist_id}", response_model=schemas.Checklist)
def update_checklist(checklist_id: int, checklist: schemas.ChecklistUpdate, db: Session = Depends(get_db)):
    """Update a checklist"""
    db_checklist = crud.update_checklist(db, checklist_id=checklist_id, checklist=checklist)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return db_checklist


@router.delete("/checklists/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist(checklist_id: int, db: Session = Depends(get_db)):
    """Delete a checklist"""
    success = crud.delete_checklist(db, checklist_id=checklist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return {"ok": True}


@router.post("/checklists/{checklist_id}/clone", response_model=schemas.Checklist)
def clone_checklist(checklist_id: int, new_title: Optional[str] = None, db: Session = Depends(get_db)):
    """Clone an existing checklist"""
    db_checklist = crud.clone_checklist(db, checklist_id=checklist_id, new_title=new_title)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return db_checklist


# Category endpoints
@router.post("/checklists/{checklist_id}/categories/", response_model=schemas.Category)
def create_category(checklist_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category for a checklist"""
    db_checklist = crud.get_checklist(db, checklist_id=checklist_id)
    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return crud.create_category(db=db, category=category, checklist_id=checklist_id)


@router.put("/categories/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category"""
    db_category = crud.update_category(db, category_id=category_id, category=category)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    success = crud.delete_category(db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}


# Item endpoints
@router.post("/categories/{category_id}/items/", response_model=schemas.Item)
def create_item(category_id: int, item: schemas.ItemCreate, db: Session = Depends(get_db)):
    """Create a new item for a category"""
    db_category = crud.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.create_item(db=db, item=item, category_id=category_id)


@router.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    """Update an item"""
    db_item = crud.update_item(db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an item"""
    success = crud.delete_item(db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}
