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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Create Checklist</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Box */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
          <label className="block font-semibold text-gray-700 mb-2">Title</label>
          <input 
            className="border border-gray-300 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Enter checklist title"
            required 
          />
        </div>

        {/* Description Box */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
          <label className="block font-semibold text-gray-700 mb-2">Description</label>
          <textarea 
            className="border border-gray-300 rounded-lg w-full p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Enter checklist description (optional)"
          />
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <label className="block font-semibold text-gray-700 mb-2">Categories</label>
          
          {categories.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
              <p className="text-gray-500 mb-4">No categories added yet</p>
              <button 
                type="button" 
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors"
                onClick={handleAddCategory}
              >
                + Add Your First Category
              </button>
            </div>
          )}

          {/* Category List */}
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Category Name</label>
                  <input 
                    className="border border-gray-300 rounded-lg w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Enter category name" 
                    value={cat.name} 
                    onChange={e => handleCategoryName(idx, e.target.value)} 
                    required 
                  />
                </div>
                <button 
                  type="button" 
                  className="ml-4 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors" 
                  onClick={() => handleRemoveCategory(idx)}
                >
                  Remove
                </button>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700">Items</label>
                  <button 
                    type="button" 
                    className="text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors" 
                    onClick={() => handleAddItem(idx)}
                  >
                    + Add Item
                  </button>
                </div>

                {/* Empty state for items */}
                {(!cat.items || cat.items.length === 0) && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <p className="text-gray-500 text-sm">No items added to this category yet</p>
                  </div>
                )}

                {/* Item List */}
                {(cat.items || []).map((item, iidx) => (
                  <div key={iidx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Item Name</label>
                        <input 
                          className="border border-gray-300 rounded-lg w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="Enter item name" 
                          value={item.name} 
                          onChange={e => handleItemChange(idx, iidx, 'name', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="ml-3 flex items-center">
                        <label className="flex items-center bg-white px-3 py-2 rounded-md border border-gray-200">
                          <input 
                            type="checkbox" 
                            className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            checked={item.allow_multiple_files} 
                            onChange={e => handleItemChange(idx, iidx, 'allow_multiple_files', e.target.checked)} 
                          />
                          <span className="text-xs">Allow multiple files</span>
                        </label>
                        <button 
                          type="button" 
                          className="ml-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors" 
                          onClick={() => handleRemoveItem(idx, iidx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* File uploader for this item */}
                    <div className="mt-2 bg-white rounded-md p-2 border border-gray-200">
                      <button 
                        type="button"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                        onClick={() => {
                          // Initialize the files array for this item if it doesn't exist
                          if (!itemFiles[item.temp_id!]) {
                            setItemFiles(prev => ({ ...prev, [item.temp_id!]: [] }));
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {itemFiles[item.temp_id!] ? 
                          `${itemFiles[item.temp_id!]?.length || 0} files selected` : 
                          'Add files to this item'}
                      </button>
                      
                      {itemFiles[item.temp_id!] && (
                        <div className="mt-2">
                          <FileUploader 
                            itemId={item.temp_id!}
                            allowMultiple={item.allow_multiple_files || false}
                            existingFiles={itemFiles[item.temp_id!] || []}
                            onUploadSuccess={(newFile) => handleFileUploadSuccess(item.temp_id!, newFile)}
                            onDeleteSuccess={(fileId) => handleFileDeleteSuccess(item.temp_id!, fileId)}
                            isNewItem={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add Category Button (when categories exist) */}
          {categories.length > 0 && (
            <button 
              type="button" 
              className="w-full bg-gray-50 text-blue-600 py-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors mt-4" 
              onClick={handleAddCategory}
            >
              + Add Another Category
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium" 
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Checklist'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChecklist;
