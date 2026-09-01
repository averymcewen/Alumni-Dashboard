import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
}

interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;

  sortConfig: SortConfig<T> | null;
  onSort: (key: keyof T) => void;
}

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortConfig,
  onSort
}: DataTableProps<T>) {


  const getSortIcon = (accessor: keyof T) => {
    if (sortConfig?.key !== accessor) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-4 w-4 text-weber-purple" />
      : <ChevronDown className="h-4 w-4 text-weber-purple" />;
  };


  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)]?.map((_, index) => (
          <div key={index} className="h-12 bg-gray-100 rounded-md mb-2"></div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="w-full">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns?.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 truncate"
                onClick={() => onSort(column.accessor)}
              >
                <div className="flex items-center space-x-1">
                  <span className="truncate">{column.header}</span>
                  <span>{getSortIcon(column.accessor)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns?.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-sm text-gray-500 truncate">
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : String(row[column.accessor] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;