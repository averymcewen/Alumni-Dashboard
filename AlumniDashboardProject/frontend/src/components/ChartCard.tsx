import React, { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div className={`card h-full flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className={`flex-1 flex items-center justify-center ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;