import React, { useEffect, useState } from 'react';
import { getChecklists } from '../api';
import { Checklist } from '../types';

const ChecklistList: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChecklists()
      .then(data => {
        setChecklists(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load checklists. Please try again later.');
        setLoading(false);
      });
  }, []);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Checklists</h1>
        <a 
          href="/checklists/create" 
          className="btn btn-primary rounded-lg"
        >
          New Checklist
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
          <a href="/checklists/create" style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              display: 'inline-block',
              transition: 'background-color 0.2s ease'
            }}
            className="hover:bg-blue-700">
            Create Checklist
          </a>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem'}} className="grid-container">
          {checklists.map(cl => (
            <a key={cl.id} href={`/checklists/${cl.id}`} style={{
                display: 'block',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease'
              }} 
              className="h-full flex flex-col hover:shadow-xl hover:border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg text-primary-700 mb-1 truncate">{cl.title}</h2>
                </div>
                <div className="bg-primary-50 p-1 rounded-full flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center">
                  <span className="text-primary-600 text-xs">→</span>
                </div>
              </div>
              
              {cl.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{cl.description}</p>
              )}
              
              <div className="mt-auto pt-2 flex items-center text-xs text-gray-500">
                <span className="flex items-center">
                  <span className="w-4 h-4 mr-1 inline-block bg-primary-100 rounded-full"></span>
                  {cl.categories?.length || 0} categories
                </span>
              </div>
              
              {/* Display categories in a grid if they exist */}
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistList;
