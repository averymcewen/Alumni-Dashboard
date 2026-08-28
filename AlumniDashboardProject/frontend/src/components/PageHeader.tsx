import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="pb-6 border-b border-gray-200  flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="mt-4 md:mt-0 flex-shrink-0 flex">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;