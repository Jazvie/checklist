// TypeScript types mirroring backend schemas

export interface FileUpload {
  id: number;
  filename: string;
  uploader?: string;
  item_id: number;
  created_at: string;
}

export interface ItemCreate {
  name: string;
  allow_multiple_files?: boolean;
  temp_id?: number; // Temporary ID for tracking files during creation
}

export interface Item {
  id: number;
  title: string;
  name?: string;
  description?: string;
  completed: boolean;
  category_id: number;
  checklist_id: number;
  allow_multiple_files: boolean;
}

export interface CategoryCreate {
  name: string;
  items?: ItemCreate[];
}

export interface Category {
  id: number;
  title: string;
  name?: string;
  checklist_id: number;
  items: Item[];
}

export interface Checklist {
  id: number;
  title: string;
  description?: string;
  public_link: string;
  edit_token: string;
  categories: Category[];
}
