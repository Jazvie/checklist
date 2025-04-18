import React from 'react';

const Navbar: React.FC = () => (
  <nav className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
    <a href="/" className="text-xl font-bold">Checklist App</a>
    <a href="/create" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded ml-4 inline-flex items-center">
      <span className="mr-1">Create Checklist</span>
    </a>
  </nav>
);

export default Navbar;
