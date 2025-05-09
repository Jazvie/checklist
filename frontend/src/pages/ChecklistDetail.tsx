import React, { useEffect, useState } from 'react';
// Get id from URL manually as a fallback for useParams
const getIdFromUrl = () => {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
};
import { Checklist, FileUpload } from '../types';
import { getChecklist, deleteChecklist, getItemFiles, cloneChecklist } from '../api';
import FileUploader from '../components/FileUploader';

const ChecklistDetail: React.FC = () => {
  const id = getIdFromUrl();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [itemFiles, setItemFiles] = useState<{[itemId: number]: FileUpload[]}>({});
  const [loadingFiles, setLoadingFiles] = useState<{[itemId: number]: boolean}>({});
  
  // Check for edit permission (simplified version - in a real app, you'd check against user session/token)
  const checkEditPermission = (checklist: Checklist) => {
    // For demo purposes, we'll assume the user has edit permission if they have the URL
    // In a real app, you'd check against a stored token or user session
    return true;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getChecklist(id)
      .then(data => {
        setChecklist(data);
        setHasEditPermission(checkEditPermission(data));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load checklist.');
        setLoading(false);
      });
  }, [id]);
  
  const handleEdit = () => {
    setIsEditing(true);
    // In a complete implementation, this would navigate to an edit form
    window.location.href = `/edit-checklist/${id}`;
  };
  
  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this checklist?') || !checklist) return;
    
    setIsDeleting(true);
    try {
      // Use the checklist's edit_token for authorization
      await deleteChecklist(Number(id), checklist.edit_token);
      window.location.href = '/';
    } catch (err) {
      setError('Failed to delete checklist. Make sure you have edit permission.');
      setIsDeleting(false);
    }
  };
  
  const handleClone = async () => {
    if (!id || !checklist) return;
    
    setIsCloning(true);
    try {
      const clonedChecklist = await cloneChecklist(Number(id));
      window.location.href = `/checklists/${clonedChecklist.id}`;
    } catch (err) {
      setError('Failed to clone checklist.');
      setIsCloning(false);
    }
  };
  
  const loadItemFiles = async (itemId: number) => {
    if (loadingFiles[itemId]) return;
    
    setLoadingFiles(prev => ({ ...prev, [itemId]: true }));
    try {
      const files = await getItemFiles(itemId);
      setItemFiles(prev => ({ ...prev, [itemId]: files }));
    } catch (err) {
      console.error(`Failed to load files for item ${itemId}:`, err);
    } finally {
      setLoadingFiles(prev => ({ ...prev, [itemId]: false }));
    }
  };
  
  const handleFileUploadSuccess = (itemId: number, newFile: FileUpload) => {
    setItemFiles(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newFile]
    }));
  };
  
  const handleFileDeleteSuccess = (itemId: number, fileId: number) => {
    setItemFiles(prev => {
      if (!prev[itemId]) return prev;
      
      return {
        ...prev,
        [itemId]: prev[itemId].filter(file => file.id !== fileId)
      };
    });
  };

  if (loading) return <div className="p-4 animate-pulse">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!checklist) return <div className="p-4">Checklist not found.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{checklist.title}</h1>
          {checklist.description && <p className="mb-4 text-gray-700">{checklist.description}</p>}
        </div>
        <div className="space-x-2">
          {hasEditPermission && (
            <>
              <button 
                onClick={handleEdit} 
                disabled={isEditing}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isEditing ? 'Editing...' : 'Edit'}
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          <button 
            onClick={handleClone} 
            disabled={isCloning}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isCloning ? 'Cloning...' : 'Clone'}
          </button>
          
          {/* Share button/link */}
          {checklist.public_link && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Public Link (Share this):</p>
              <div className="flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/checklists/public/${checklist.public_link}`}
                  className="text-xs p-1 border rounded flex-1 bg-gray-50"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/checklists/public/${checklist.public_link}`)}
                  className="ml-2 text-blue-600 text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {checklist.categories.length === 0 ? (
        <div className="text-gray-500">No categories.</div>
      ) : (
        checklist.categories.map(cat => (
          <div key={cat.id} className="mb-4">
            <h2 className="font-semibold text-lg mb-2">{cat.title || cat.name}</h2>
            {cat.items.length === 0 ? (
              <div className="text-gray-400 ml-4">No items</div>
            ) : (
              <ul className="ml-4 list-disc">
                {cat.items.map(item => (
                  <li key={item.id} className="mb-3">
                    <div className="font-medium">
                      {item.title || item.name} {item.allow_multiple_files ? <span className="text-xs text-blue-700">(multiple files)</span> : null}
                    </div>
                    
                    {/* File uploader component */}
                    <div className="mt-1">
                      <button 
                        onClick={() => loadItemFiles(item.id)} 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {loadingFiles[item.id] ? 'Loading files...' : 
                         itemFiles[item.id] ? `${itemFiles[item.id].length} files uploaded` : 'View/Upload Files'}
                      </button>
                      
                      {itemFiles[item.id] && (
                        <FileUploader 
                          itemId={item.id}
                          allowMultiple={item.allow_multiple_files}
                          existingFiles={itemFiles[item.id] || []}
                          onUploadSuccess={(newFile) => handleFileUploadSuccess(item.id, newFile)}
                          onDeleteSuccess={(fileId) => handleFileDeleteSuccess(item.id, fileId)}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ChecklistDetail;
