from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

class FileUploadBase(BaseModel):
    filename: str
    uploaded_at: Optional[datetime.datetime] = None
    uploader: Optional[str] = None

class FileUploadCreate(BaseModel):
    filename: str
    uploader: Optional[str] = None

class FileUpload(FileUploadBase):
    id: int
    class Config:
        orm_mode = True

class ItemBase(BaseModel):
    name: str
    allow_multiple_files: bool = False

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    uploads: List[FileUpload] = []
    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    items: List[ItemCreate] = []

class CategoryUpdate(CategoryBase):
    items: Optional[List[ItemCreate]] = None

class Category(CategoryBase):
    id: int
    items: List[Item] = []
    class Config:
        orm_mode = True

class ChecklistBase(BaseModel):
    title: str
    description: Optional[str] = None

class ChecklistCreate(ChecklistBase):
    categories: List[CategoryCreate] = []

class ChecklistUpdate(ChecklistBase):
    categories: Optional[List[CategoryCreate]] = None

class Checklist(ChecklistBase):
    id: int
    public_link: str
    edit_token: str
    created_at: datetime.datetime
    categories: List[Category] = []
    class Config:
        orm_mode = True

