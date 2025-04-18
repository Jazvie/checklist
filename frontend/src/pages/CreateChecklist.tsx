import React, { useState } from 'react';
import { Checklist, CategoryCreate, ItemCreate } from '../types';
import { createChecklist } from '../api';

const emptyCategory = (): CategoryCreate => ({ name: '', items: [] });
const emptyItem = (): ItemCreate => ({ name: '', allow_multiple_files: false });

const CreateChecklist: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryCreate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use window.location for navigation as a fallback
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const handleAddCategory = () => setCategories([...categories, emptyCategory()]);
  const handleRemoveCategory = (idx: number) => setCategories(categories.filter((_, i) => i !== idx));
  const handleCategoryName = (idx: number, name: string) => {
    const updated = [...categories];
    updated[idx].name = name;
    setCategories(updated);
  };
  const handleAddItem = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items = [...(updated[catIdx].items || []), emptyItem()];
    setCategories(updated);
  };
  const handleRemoveItem = (catIdx: number, itemIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items = (updated[catIdx].items || []).filter((_, i) => i !== itemIdx);
    setCategories(updated);
  };
  const handleItemChange = (catIdx: number, itemIdx: number, field: 'name' | 'allow_multiple_files', value: any) => {
    const updated = [...categories];
    const items = updated[catIdx].items || [];
    if (field === 'name') {
      items[itemIdx].name = value;
    } else if (field === 'allow_multiple_files') {
      items[itemIdx].allow_multiple_files = value;
    }
    setCategories(updated);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Log the payload we're sending
      const checklist: any = { title, description, categories };
      console.log('Sending checklist data:', JSON.stringify(checklist, null, 2));
      
      const created = await createChecklist(checklist);
      console.log('Response:', created);
      setLoading(false);
      navigate(`/`); // Optionally redirect to checklist page
    } catch (err: any) {
      console.error('Error creating checklist:', err);
      // Show more detailed error message
      setError(`Failed to create checklist: ${err.message || 'Unknown error'}`);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Checklist</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input className="border rounded w-full p-2" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block font-semibold">Description</label>
          <textarea className="border rounded w-full p-2" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block font-semibold mb-2">Categories</label>
          {categories.map((cat, idx) => (
            <div key={idx} className="border rounded p-2 mb-2">
              <div className="flex items-center mb-2">
                <input className="border rounded flex-1 p-1 mr-2" placeholder="Category Name" value={cat.name} onChange={e => handleCategoryName(idx, e.target.value)} required />
                <button type="button" className="text-red-600 ml-2" onClick={() => handleRemoveCategory(idx)}>Remove</button>
              </div>
              <div className="ml-4">
                <label className="block font-semibold">Items</label>
                {(cat.items || []).map((item, iidx) => (
                  <div key={iidx} className="flex items-center mb-1">
                    <input className="border rounded flex-1 p-1 mr-2" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(idx, iidx, 'name', e.target.value)} required />
                    <label className="flex items-center mr-2">
                      <input type="checkbox" checked={item.allow_multiple_files} onChange={e => handleItemChange(idx, iidx, 'allow_multiple_files', e.target.checked)} />
                      <span className="ml-1 text-xs">Allow multiple files</span>
                    </label>
                    <button type="button" className="text-red-600 ml-2" onClick={() => handleRemoveItem(idx, iidx)}>Remove</button>
                  </div>
                ))}
                <button type="button" className="text-blue-600 text-xs mt-1" onClick={() => handleAddItem(idx)}>+ Add Item</button>
              </div>
            </div>
          ))}
          <button type="button" className="text-blue-600 mt-2" onClick={handleAddCategory}>+ Add Category</button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Checklist'}</button>
      </form>
    </div>
  );
};

export default CreateChecklist;
