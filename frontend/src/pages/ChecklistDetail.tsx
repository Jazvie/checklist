import React, { useEffect, useState } from 'react';
// Get id from URL manually as a fallback for useParams
const getIdFromUrl = () => {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
};
import { Checklist } from '../types';
import { getChecklist, deleteChecklist } from '../api';

const ChecklistDetail: React.FC = () => {
  const id = getIdFromUrl();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  
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
    if (!id || !window.confirm('Are you sure you want to delete this checklist?')) return;
    
    setIsDeleting(true);
    try {
      await deleteChecklist(Number(id));
      window.location.href = '/';
    } catch (err) {
      setError('Failed to delete checklist.');
      setIsDeleting(false);
    }
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
        {hasEditPermission && (
          <div className="space-x-2">
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
          </div>
        )}
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
                  <li key={item.id} className="mb-1">
                    {item.title || item.name} {item.allow_multiple_files ? <span className="text-xs text-blue-700">(multiple files)</span> : null}
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
