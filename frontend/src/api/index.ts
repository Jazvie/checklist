// API utility functions for backend endpoints
import axios from 'axios';
import { Checklist, Category, Item, FileUpload } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function getChecklists(): Promise<Checklist[]> {
  const res = await axios.get(`${API_BASE}/checklists/`);
  return res.data;
}

export async function getChecklist(id: number | string): Promise<Checklist> {
  const res = await axios.get(`${API_BASE}/checklists/${id}`);
  return res.data;
}

// Add more API functions as you build out the frontend
