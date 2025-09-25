import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({ 
  data = [], 
  columns = [], 
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onSort = () => {},
  sortField = null,
  sortDirection = 'asc',
  className = ''
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [localSortField, setLocalSortField] = useState(null);
  const [localSortDirection, setLocalSortDirection] = useState('asc');

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(data.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (field) => {
    const effectiveField = sortField ?? localSortField;
    const effectiveDir = sortDirection ?? localSortDirection;
    if (effectiveField === field) {
      const nextDir = effectiveDir === 'asc' ? 'desc' : 'asc';
      setLocalSortField(field);
      setLocalSortDirection(nextDir);
      onSort && onSort(field, nextDir);
    } else {
      setLocalSortField(field);
      setLocalSortDirection('asc');
      onSort && onSort(field, 'asc');
    }
  };

  const effectiveSortField = sortField ?? localSortField;
  const effectiveSortDirection = sortDirection ?? localSortDirection;

  const sortedData = useMemo(() => {
    if (!effectiveSortField) return data;
    const col = columns.find(c => c.key === effectiveSortField);
    if (!col) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = a[effectiveSortField];
      const bv = b[effectiveSortField];
      // Attempt basic type-aware compare
      const ax = typeof av === 'string' ? av.toLowerCase() : av;
      const bx = typeof bv === 'string' ? bv.toLowerCase() : bv;
      if (ax == null && bx == null) return 0;
      if (ax == null) return effectiveSortDirection === 'asc' ? -1 : 1;
      if (bx == null) return effectiveSortDirection === 'asc' ? 1 : -1;
      if (ax < bx) return effectiveSortDirection === 'asc' ? -1 : 1;
      if (ax > bx) return effectiveSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, columns, effectiveSortField, effectiveSortDirection]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.some(col => col.type === 'checkbox') && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
        {column.sortable && effectiveSortField === column.key && (
                      <span className="text-indigo-600">
      {effectiveSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
      <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
    <td colSpan={columns.length + (columns.some(col => col.type === 'checkbox') ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">📄</span>
                    </div>
                    <p>No data available</p>
                  </div>
                </td>
              </tr>
            ) : (
  sortedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
          className="hover:bg-gray-50 transition-colors"
                >
                  {columns.some(col => col.type === 'checkbox') && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={(e) => handleSelectRow(index, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="sm:hidden text-xs text-gray-500 mb-1">{column.title}</div>
                      {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
    <div className="bg-white px-2 sm:px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
      <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.per_page + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.per_page, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange(1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                    const pageNum = pagination.page - 2 + i;
                    if (pageNum < 1 || pageNum > pagination.total_pages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onPageChange(pagination.total_pages)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
