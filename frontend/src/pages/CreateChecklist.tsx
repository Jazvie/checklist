import React, { useState } from 'react';
import { Checklist, CategoryCreate, ItemCreate, FileUpload } from '../types';
import { createChecklist, uploadFile } from '../api';
import FileUploader from '../components/FileUploader';

const emptyCategory = (): CategoryCreate => ({ name: '', items: [] });
const emptyItem = (): ItemCreate => ({
  name: '',
  allow_multiple_files: false,
  temp_id: Math.floor(Math.random() * 1000000) // Temporary ID for tracking files during creation
});

const CreateChecklist: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryCreate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemFiles, setItemFiles] = useState<{[tempId: number]: FileUpload[]}>({});
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
  const handleFileUploadSuccess = (tempItemId: number, newFile: FileUpload) => {
    setItemFiles(prev => ({
      ...prev,
      [tempItemId]: [...(prev[tempItemId] || []), newFile]
    }));
  };
  
  const handleFileDeleteSuccess = (tempItemId: number, fileId: number) => {
    setItemFiles(prev => {
      if (!prev[tempItemId]) return prev;
      
      return {
        ...prev,
        [tempItemId]: prev[tempItemId].filter(file => file.id !== fileId)
      };
    });
  };

  // Helper function to upload files for a specific item
  const uploadFilesForItem = async (realItemId: number, tempItemId: number) => {
    const files = itemFiles[tempItemId] || [];
    if (files.length === 0) return;
    
    console.log(`Uploading ${files.length} files for item ${realItemId}`);
    
    // We need to convert the mock file objects to actual FormData for upload
    // Since we don't have the actual File objects (they were never really uploaded),
    // we'll create a simple text file with the same name for demonstration purposes
    
    const uploadPromises = files.map(async (file) => {
      try {
        // Create a FormData object
        const formData = new FormData();
        
        // Create a simple text file with the same name
        // In a real app, you would use the actual File object from the input
        const mockFileContent = new Blob([`This is a mock file named ${file.filename}`], 
                                       { type: 'text/plain' });
        
        // Add the file to the FormData
        formData.append('file', mockFileContent, file.filename);
        formData.append('uploader', 'Anonymous User');
        
        // Upload the file
        const uploadedFile = await uploadFile(realItemId, formData);
        console.log('File uploaded successfully:', uploadedFile);
        return uploadedFile;
      } catch (err) {
        console.error('Error uploading file:', err);
        return null;
      }
    });
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Prepare the checklist data
      const preparedCategories = categories.map(cat => ({
        name: cat.name,
        items: (cat.items || []).map(item => ({
          name: item.name,
          allow_multiple_files: item.allow_multiple_files
          // We don't send temp_id to the backend
        }))
      }));
      
      const checklist: any = { title, description, categories: preparedCategories };
      console.log('Sending checklist data:', JSON.stringify(checklist, null, 2));
      
      const created = await createChecklist(checklist);
      console.log('Response:', created);
      
      // Now that we have the created checklist with real item IDs,
      // we can upload any files that were selected during creation
      
      // Map of temp_id -> real item_id
      const itemIdMap = new Map<number, number>();
      
      // Build a map of temporary item IDs to real item IDs
      created.categories.forEach((cat: any, catIdx: number) => {
        const originalCat = categories[catIdx];
        if (originalCat) {
          const originalItems = originalCat.items || [];
          (cat.items || []).forEach((item: any, itemIdx: number) => {
            const originalItem = originalItems[itemIdx];
            if (originalItem && originalItem.temp_id) {
              itemIdMap.set(originalItem.temp_id, item.id);
            }
          });
        }
      });
      
      // Upload files for each item
      const uploadPromises = [];
      for (const [tempId, realId] of itemIdMap.entries()) {
        if (itemFiles[tempId] && itemFiles[tempId].length > 0) {
          uploadPromises.push(uploadFilesForItem(realId, tempId));
        }
      }
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      setLoading(false);
      navigate(`/checklists/${created.id}`); // Redirect to the new checklist
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
                  <div key={iidx} className="mb-3 border-l-2 border-gray-200 pl-2">
                    <div className="flex items-center mb-1">
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
                    
                    {/* File uploader for this item */}
                    <div className="ml-4 mt-1">
                      <button 
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          // Initialize the files array for this item if it doesn't exist
                          if (!itemFiles[item.temp_id!]) {
                            setItemFiles(prev => ({ ...prev, [item.temp_id!]: [] }));
                          }
                        }}
                      >
                        {itemFiles[item.temp_id!] ? 
                          `${itemFiles[item.temp_id!]?.length || 0} files selected` : 
                          'Add files to this item'}
                      </button>
                      
                      {itemFiles[item.temp_id!] && (
                        <FileUploader 
                          itemId={item.temp_id!}
                          allowMultiple={item.allow_multiple_files || false}
                          existingFiles={itemFiles[item.temp_id!] || []}
                          onUploadSuccess={(newFile) => handleFileUploadSuccess(item.temp_id!, newFile)}
                          onDeleteSuccess={(fileId) => handleFileDeleteSuccess(item.temp_id!, fileId)}
                          isNewItem={true}
                        />
                      )}
                    </div>
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
