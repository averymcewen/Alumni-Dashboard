import React, { useState } from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'alumni': return 'Alumni Directory';
      case 'alumniProfile': return 'Alumni Profile';
      case 'employment': return 'Employment';
      case 'graduate': return 'Graduate Admissions';
      case 'surveys': return 'Surveys';
      case 'internships': return 'Internships';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            className="md:hidden p-2 mr-2 text-gray-600 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{pageTitle()}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="py-2 pl-10 pr-4 w-64 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
          </div>
          <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100">
            <Bell size={20} />
          </button>
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            AM
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="px-4 py-3 md:hidden border-t border-gray-200">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
          </div>
          <div className="space-y-1">
            {[
              { id: 'dashboard', name: 'Dashboard' },
              { id: 'alumni', name: 'Alumni Directory' },
              { id: 'employment', name: 'Employment' },
              { id: 'graduate', name: 'Graduate Admissions' },
              { id: 'surveys', name: 'Surveys' },
              { id: 'internships', name: 'Internships' },
              { id: 'settings', name: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                className={`block w-full text-left px-3 py-2 rounded-lg ${currentPage === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};