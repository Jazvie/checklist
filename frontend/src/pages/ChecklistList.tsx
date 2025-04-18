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
    <div className="max-w-4xl mx-auto p-6">
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
        <div className="card bg-white p-8 text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">+</span>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No checklists yet</h3>
          <p className="text-gray-500 mb-4">Create your first checklist to get started</p>
          <a href="/checklists/create" className="btn btn-primary inline-block rounded-lg">
            Create Checklist
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklists.map(cl => (
            <a key={cl.id} href={`/checklists/${cl.id}`} className="card hover:shadow-lg transition-shadow duration-200 bg-white rounded-lg p-4 border border-gray-100 block">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg text-primary-700 mb-1 truncate">{cl.title}</h2>
                  {cl.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{cl.description}</p>
                  )}
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-4 h-4 mr-1 inline-block bg-primary-100 rounded-full"></span>
                      {cl.categories?.length || 0} categories
                    </span>
                  </div>
                </div>
                <div className="bg-primary-50 p-1 rounded-full flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center">
                  <span className="text-primary-600 text-xs">→</span>
                </div>
              </div>
              
              {/* Display categories in a grid if they exist */}
              {cl.categories && cl.categories.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {cl.categories.slice(0, 4).map((cat, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center overflow-hidden">
                      <svg className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                    </div>
                  ))}
                  {cl.categories.length > 4 && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{cl.categories.length - 4} more</span>
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
