// TypeScript types mirroring backend schemas

export interface FileUpload {
  id: number;
  filename: string;
  uploader?: string;
  item_id: number;
  created_at: string;
}

export interface Item {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  category_id: number;
  checklist_id: number;
  allow_multiple_files: boolean;
}

export interface Category {
  id: number;
  title: string;
  checklist_id: number;
  items: Item[];
}

export interface Checklist {
  id: number;
  title: string;
  public_link: string;
  edit_token: string;
  categories: Category[];
}
