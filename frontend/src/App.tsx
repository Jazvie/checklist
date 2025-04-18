import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ChecklistList from './pages/ChecklistList';
import CreateChecklist from './pages/CreateChecklist';
import ChecklistDetail from './pages/ChecklistDetail';
import EditChecklist from './pages/EditChecklist';
import PublicChecklist from './pages/PublicChecklist';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Simple routing based on path
  const renderContent = () => {
    if (currentPath === '/') {
      return <ChecklistList />;
    } else if (currentPath === '/create') {
      return <CreateChecklist />;
    } else if (currentPath.startsWith('/edit-checklist/')) {
      return <EditChecklist />;
    } else if (currentPath.startsWith('/checklists/public/')) {
      return <PublicChecklist />;
    } else if (currentPath.startsWith('/checklists/')) {
      return <ChecklistDetail />;
    } else {
      return <ChecklistList />; // Default to home
    }
  };

  return (
    <div>
      <Navbar />
      {renderContent()}
    </div>
  );
}

export default App;
