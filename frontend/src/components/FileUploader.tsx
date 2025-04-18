import React, { useState, useRef } from 'react';
import { FileUpload } from '../types';
import { uploadFile, deleteFile } from '../api';

// Base URL for file downloads
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';

interface FileUploaderProps {
  itemId: number;
  allowMultiple: boolean;
  existingFiles: FileUpload[];
  onUploadSuccess: (newFile: FileUpload) => void;
  onDeleteSuccess?: (fileId: number) => void;
  disabled?: boolean;
  isNewItem?: boolean; // Flag to indicate if this is for a new item being created
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  itemId, 
  allowMultiple, 
  existingFiles, 
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  isNewItem = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if multiple files are allowed
    if (!allowMultiple && existingFiles.length > 0) {
      setError('This item only allows one file. Please delete the existing file first.');
      return;
    }

    // Check if trying to upload multiple files when not allowed
    if (!allowMultiple && files.length > 1) {
      setError('This item only allows one file. Please select only one file.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Process all selected files (if multiple is allowed) or just the first one
      const filesToProcess = allowMultiple ? Array.from(files) : [files[0]];
      
      for (const file of filesToProcess) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Optional: Add uploader name (could be from user profile in a real app)
        formData.append('uploader', 'Anonymous User');
        
        if (isNewItem) {
          // For new items being created, we'll just store the file temporarily
          // and handle the actual upload when the checklist is saved
          const mockUpload: FileUpload = {
            id: Math.floor(Math.random() * 10000), // Temporary ID
            filename: file.name,
            uploader: 'Anonymous User',
            item_id: itemId,
            created_at: new Date().toISOString()
          };
          onUploadSuccess(mockUpload);
        } else {
          // For existing items, upload directly to the server
          const uploadedFile = await uploadFile(itemId, formData);
          onUploadSuccess(uploadedFile);
        }
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      if (!isNewItem) {
        await deleteFile(fileId);
      }
      
      if (onDeleteSuccess) {
        onDeleteSuccess(fileId);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`Delete failed: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Get the download URL for a file
  const getFileDownloadUrl = (fileId: number) => {
    return `${API_BASE}/uploads/${fileId}/download`;
  };

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={uploading || disabled}
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          accept=".txt,.pdf,.xlsx,.doc,.docx"
          multiple={allowMultiple}
        />
        {uploading && <span className="ml-2 text-gray-500 text-sm">Uploading...</span>}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      
      {/* Display existing files */}
      {existingFiles.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium">Uploaded files:</p>
          <ul className="list-disc ml-5 text-sm">
            {existingFiles.map(file => (
              <li key={file.id} className="flex items-center justify-between text-gray-700 mb-1">
                <div>
                  <span className="font-medium">{file.filename}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {file.uploader && `(by ${file.uploader})`}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {!isNewItem && (
                    <a 
                      href={getFileDownloadUrl(file.id)} 
                      download
                      className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                      title="Download file"
                    >
                      Download
                    </a>
                  )}
                  <button 
                    type="button" 
                    onClick={() => handleDeleteFile(file.id)}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
