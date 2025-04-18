import React, { useEffect, useState } from 'react';
// Get public link from URL
const getPublicLinkFromUrl = () => {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
};

import { Checklist, FileUpload } from '../types';
import { getItemFiles } from '../api';
import FileUploader from '../components/FileUploader';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const PublicChecklist: React.FC = () => {
  const publicLink = getPublicLinkFromUrl();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemFiles, setItemFiles] = useState<{[itemId: number]: FileUpload[]}>({});
  const [loadingFiles, setLoadingFiles] = useState<{[itemId: number]: boolean}>({});

  useEffect(() => {
    if (!publicLink) return;
    
    setLoading(true);
    // Use the public link endpoint
    axios.get(`${API_BASE}/checklists/public/${publicLink}`)
      .then(response => {
        setChecklist(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading shared checklist:', err);
        setError('Failed to load the shared checklist. The link may be invalid or expired.');
        setLoading(false);
      });
  }, [publicLink]);

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

  if (loading) return <div className="p-4 animate-pulse">Loading shared checklist...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!checklist) return <div className="p-4">Checklist not found.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-blue-800 text-sm">
          <span className="font-bold">Shared Checklist</span> - You can view this checklist and upload files, but cannot edit its structure.
        </p>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">{checklist.title}</h1>
      {checklist.description && <p className="mb-4 text-gray-700">{checklist.description}</p>}
      
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

export default PublicChecklist;
