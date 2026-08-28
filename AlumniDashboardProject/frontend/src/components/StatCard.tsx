import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className = '' 
}) => {
  return (
    <div className={`card hover:border-weber-purple ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-200 bg-opacity/10">
          <Icon className="h-6 w-6 text-weber-purple-dark" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-success' : 'text-error'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
          <span className="ml-2 text-sm text-gray-500">from previous year</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;