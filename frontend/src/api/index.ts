// API utility functions for backend endpoints
import axios from 'axios';
import { Checklist, Category, Item, FileUpload } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export async function getChecklists(): Promise<Checklist[]> {
  const res = await axios.get(`${API_BASE}/checklists/`);
  return res.data;
}

export async function getChecklist(id: number | string): Promise<Checklist> {
  const res = await axios.get(`${API_BASE}/checklists/${id}`);
  return res.data;
}

export async function createChecklist(data: any): Promise<any> {
  const res = await axios.post(`${API_BASE}/checklists/`, data);
  return res.data;
}

export async function updateChecklist(id: number, data: any, editToken: string): Promise<any> {
  const res = await axios.put(`${API_BASE}/checklists/${id}?edit_token=${editToken}`, data);
  return res.data;
}

export async function deleteChecklist(id: number, editToken: string): Promise<void> {
  await axios.delete(`${API_BASE}/checklists/${id}?edit_token=${editToken}`);
}

// Add more API functions as you build out the frontend
