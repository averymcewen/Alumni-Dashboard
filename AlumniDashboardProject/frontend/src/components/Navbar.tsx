import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Form } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/alumni?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <Logo />
            </div>
          </div>

          {/* <div className="flex-1 px-2 mx-2">
            <div className="max-w-lg w-full lg:max-w-md mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-weber-purple focus:border-weber-purple sm:text-sm"
                  placeholder="Search for alumni..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
          </div> */}

          {/* <div className="flex items-center">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-weber-purple"
            >
              <Bell className="h-6 w-6" />
            </button>
            <div className="ml-3 relative">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-weber-purple flex items-center justify-center text-white font-medium">
                  A
                </div>
                <span className="hidden md:inline-block ml-2 text-sm font-medium text-gray-700">
                  Admin
                </span>
              </div>
            </div>
          </div> */}



        </div>
      </div>
    </header>
  );
};

export default Navbar;