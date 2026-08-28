import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Weber State University - College of Engineering, Applied Science & Technology
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;