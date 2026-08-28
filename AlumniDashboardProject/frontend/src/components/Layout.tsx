import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebarOpen, toggleSidebar }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;