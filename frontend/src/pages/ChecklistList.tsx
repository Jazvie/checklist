import React, { useEffect, useState } from 'react';
import { getChecklists, cloneChecklist, deleteChecklist } from '../api';
import { Checklist } from '../types';

const ChecklistList: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[id: number]: string}>({});

  const loadChecklists = () => {
    setLoading(true);
    getChecklists()
      .then(data => {
        setChecklists(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load checklists. Please try again later.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadChecklists();
  }, []);
  
  const handleClone = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'clone' }));
      const clonedChecklist = await cloneChecklist(id);
      // Navigate to the edit page of the newly created copy
      window.location.href = `/edit-checklist/${clonedChecklist.id}?token=${clonedChecklist.edit_token}`;
    } catch (err) {
      setError('Failed to clone checklist. Please try again.');
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };
  
  const handleDelete = async (e: React.MouseEvent, id: number, editToken: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      try {
        setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
        await deleteChecklist(id, editToken);
        loadChecklists();
      } catch (err) {
        setError('Failed to delete checklist. Please try again.');
      } finally {
        setActionLoading(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-gray-800">My Checklists</h1>
        <a 
          href="/create" 
          className="btn btn-primary rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
          <span>New Checklist</span>
        </a>
      </div>
      
      {checklists.length === 0 ? (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-blue-600 text-3xl font-bold">+</span>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-3">No checklists yet</h3>
          <p className="text-gray-500 mb-6">Create your first checklist to get started</p>
          <a href="/create" style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            className="hover:bg-blue-700">
            <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
            <span>New Checklist</span>
          </a>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2.5rem', padding: '1rem'}} className="grid-container">
          {checklists.map(cl => (
            <a key={cl.id} href={`/checklists/${cl.id}`} style={{
                display: 'block',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px 20px 8px 20px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease',
                margin: '0',
                position: 'relative',
                overflow: 'hidden'
              }} 
              className="h-full flex flex-col hover:shadow-xl hover:border-blue-200">
              <div style={{ height: '180px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg text-primary-700 mb-1 truncate">{cl.title}</h2>
                  </div>
                  <div className="bg-primary-50 p-1 rounded-full flex-shrink-0 ml-1 w-8 h-8 flex items-center justify-center">
                    <span className="text-primary-600 text-xs">→</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <div className="flex items-center">
                    <span>{cl.categories.length || 0} categories</span>
                  </div>
                </div>
                
                {cl.categories && cl.categories.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {cl.categories.slice(0, 2).map((cat, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center overflow-hidden">
                        <span className="w-3 h-3 mr-1 inline-block bg-primary-100 rounded-full"></span>
                        <span className="text-xs font-medium truncate">{cat.name}</span>
                      </div>
                    ))}
                    {cl.categories.length > 2 && (
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{cl.categories.length - 2} more</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ paddingTop: '6px', borderTop: '1px solid #f3f4f6', marginTop: '0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', width: '100%', marginTop: '2px', marginBottom: '0' }}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/edit-checklist/${cl.id}?token=${cl.edit_token}`;
                    }}
                    style={{
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      padding: '5px 0',
                      width: '100%',
                      borderRadius: '6px 0 0 6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    className="hover:bg-green-100 transition-colors"
                    title="Edit checklist"
                  >
                    <div className="flex items-center justify-center w-full">
                      <span>✎</span>
                      <span className="ml-1">Edit</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={(e) => handleClone(e, cl.id)}
                    disabled={actionLoading[cl.id] === 'clone'}
                    style={{
                      backgroundColor: '#ebf5ff',
                      color: '#2563eb',
                      padding: '5px 0',
                      width: '100%',
                      borderRadius: '0',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    className="hover:bg-blue-100 transition-colors"
                    title="Clone checklist"
                  >
                    {actionLoading[cl.id] === 'clone' ? (
                      <span className="animate-pulse">Cloning...</span>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <span>+</span>
                        <span className="ml-1">Clone</span>
                      </div>
                    )}
                  </button>

                  <button 
                    onClick={(e) => handleDelete(e, cl.id, cl.edit_token)}
                    disabled={actionLoading[cl.id] === 'delete'}
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      padding: '5px 0',
                      width: '100%',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    className="hover:bg-red-100 transition-colors"
                    title="Delete checklist"
                  >
                    {actionLoading[cl.id] === 'delete' ? (
                      <span className="animate-pulse">Deleting...</span>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <span>×</span>
                        <span className="ml-1">Delete</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistList;
