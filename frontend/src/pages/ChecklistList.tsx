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

  if (loading) return <div className="p-4 animate-pulse">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Checklists</h1>
      <ul className="space-y-2">
        {checklists.map(cl => (
          <li key={cl.id} className="bg-white shadow rounded p-4">
            <a href={`/checklists/${cl.id}`} className="font-semibold text-blue-700 hover:underline">{cl.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChecklistList;
