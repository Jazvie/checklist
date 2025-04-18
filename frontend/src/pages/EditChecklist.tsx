import React, { useEffect, useState } from 'react';
import { Checklist, CategoryCreate, ItemCreate } from '../types';
import { getChecklist, updateChecklist } from '../api';

// Get id from URL manually
const getIdFromUrl = () => {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
};

const EditChecklist: React.FC = () => {
  const id = getIdFromUrl();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryCreate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editToken, setEditToken] = useState('');  // Store the edit token for authorization

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    getChecklist(id)
      .then(data => {
        setTitle(data.title);
        setDescription(data.description || '');
        setEditToken(data.edit_token); // Store the edit token for authorization
        
        // Convert backend categories to CategoryCreate format
        const formattedCategories = data.categories.map((cat: any) => ({
          name: cat.title || cat.name,
          items: cat.items.map((item: any) => ({
            name: item.title || item.name,
            allow_multiple_files: item.allow_multiple_files
          }))
        }));
        
        setCategories(formattedCategories);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching checklist:', err);
        setError('Failed to load checklist data.');
        setLoading(false);
      });
  }, [id]);

  const handleAddCategory = () => setCategories([...categories, { name: '', items: [] }]);
  
  const handleRemoveCategory = (idx: number) => setCategories(categories.filter((_, i) => i !== idx));
  
  const handleCategoryName = (idx: number, name: string) => {
    const updated = [...categories];
    updated[idx].name = name;
    setCategories(updated);
  };
  
  const handleAddItem = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items = [...(updated[catIdx].items || []), { name: '', allow_multiple_files: false }];
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
    if (!id || !editToken) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const checklist = { title, description, categories };
      console.log('Updating checklist with data:', JSON.stringify(checklist, null, 2));
      console.log('Using edit token:', editToken);
      
      await updateChecklist(Number(id), checklist, editToken);
      window.location.href = `/checklists/${id}`;
    } catch (err: any) {
      console.error('Error updating checklist:', err);
      setError(`Failed to update checklist: ${err.message || 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.href = `/checklists/${id}`;
  };

  if (loading) return <div className="p-4 animate-pulse">Loading checklist data...</div>;
  if (error && !saving) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Checklist</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input 
            className="border rounded w-full p-2" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block font-semibold">Description</label>
          <textarea 
            className="border rounded w-full p-2" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Categories</label>
          {categories.map((cat, idx) => (
            <div key={idx} className="border rounded p-2 mb-2">
              <div className="flex items-center mb-2">
                <input 
                  className="border rounded flex-1 p-1 mr-2" 
                  placeholder="Category Name" 
                  value={cat.name} 
                  onChange={e => handleCategoryName(idx, e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="text-red-600 ml-2" 
                  onClick={() => handleRemoveCategory(idx)}
                >
                  Remove
                </button>
              </div>
              <div className="ml-4">
                <label className="block font-semibold">Items</label>
                {(cat.items || []).map((item, iidx) => (
                  <div key={iidx} className="flex items-center mb-1">
                    <input 
                      className="border rounded flex-1 p-1 mr-2" 
                      placeholder="Item Name" 
                      value={item.name} 
                      onChange={e => handleItemChange(idx, iidx, 'name', e.target.value)} 
                      required 
                    />
                    <label className="flex items-center mr-2">
                      <input 
                        type="checkbox" 
                        checked={item.allow_multiple_files} 
                        onChange={e => handleItemChange(idx, iidx, 'allow_multiple_files', e.target.checked)} 
                      />
                      <span className="ml-1 text-xs">Allow multiple files</span>
                    </label>
                    <button 
                      type="button" 
                      className="text-red-600 ml-2" 
                      onClick={() => handleRemoveItem(idx, iidx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="text-blue-600 text-xs mt-1" 
                  onClick={() => handleAddItem(idx)}
                >
                  + Add Item
                </button>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            className="text-blue-600 mt-2" 
            onClick={handleAddCategory}
          >
            + Add Category
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex space-x-2">
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="border border-gray-300 px-4 py-2 rounded" 
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditChecklist;
