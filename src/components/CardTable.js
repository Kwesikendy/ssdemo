import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function CardTable({ 
  data = [], 
  columns = [], 
  loading = false,
  onRowClick = () => {},
  emptyMessage = "No data available",
  className = '',
  searchable = true,
  selectable = false, // Can be boolean or function
  onSelectionChange = () => {},
  pagination = null,
  onPageChange = () => {},
  searchPlaceholder = "Search...",
  searchFields = [],
  bulkActions = [],
  itemsPerPage = 10
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => {
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const value = row[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
      }
      
      // Default search across all string fields
      return Object.values(row).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [data, searchTerm, searchable, searchFields]);

  // Reset current page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [searchTerm]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (pagination) {
      // Use external pagination - return all filtered data
      return filteredData;
    }
    
    // Use internal pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage, pagination]);

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (pagination) {
      return pagination;
    }
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    return {
      page: currentPage,
      per_page: itemsPerPage,
      total: filteredData.length,
      total_pages: totalPages
    };
  }, [filteredData.length, currentPage, itemsPerPage, pagination]);

  // Check if row is selectable
  const isRowSelectable = (row) => {
    if (typeof selectable === 'function') {
      return selectable(row);
    }
    return selectable;
  };

  // Get selectable rows
  const selectableRows = paginatedData.filter(isRowSelectable);

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelection = new Set(selectableRows.map(row => row.id || paginatedData.indexOf(row)));
      setSelectedRows(newSelection);
      onSelectionChange(selectableRows);
    } else {
      setSelectedRows(new Set());
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId, checked) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    
    // Get selected rows data consistently
    const selectedData = paginatedData.filter(row => newSelection.has(row.id || paginatedData.indexOf(row)));
    onSelectionChange(selectedData);
  };

  // Get selected rows data
  const getSelectedRowsData = () => {
    return paginatedData.filter(row => selectedRows.has(row.id || paginatedData.indexOf(row)));
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (pagination) {
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    const selectedData = getSelectedRowsData();
    if (action.onClick) {
      action.onClick(selectedData);
    }
  };
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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <div className="flex items-center space-x-4">
            {selectableRows.length > 0 && selectedRows.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedRows.size} selected
                </span>
                {bulkActions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {bulkActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const selectedData = getSelectedRowsData();
                          if (selectedData.length === 0) {
                            return;
                          }
                          if (action.onClick) {
                            action.onClick(selectedData);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                          action.variant === 'danger' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                        disabled={action.disabled || selectedRows.size === 0}
                      >
                        {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {searchable && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {/* Select All Checkbox */}
      {selectableRows.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRows.size === selectableRows.length && selectableRows.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Select all ({selectableRows.length} items)
            </label>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {paginatedData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching items found' : 'No items found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : emptyMessage}
            </p>
          </div>
        ) : (
          paginatedData.map((row, index) => {
            const rowId = row.id || index;
            return (
              <motion.div
                key={rowId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Checkbox */}
                    {isRowSelectable(row) && (
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(rowId, e.target.checked);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    )}
                  
                    {/* Content */}
                    {columns.map((column, colIndex) => {
                      if (column.key === 'actions') return null;
                      if (column.key === 'checkbox') return null;
                      
                      return (
                        <div key={column.key} className={colIndex === 0 ? 'flex items-center space-x-3' : 'ml-4'}>
                          {colIndex === 0 && column.render ? (
                            column.render(row[column.key], row, index)
                          ) : colIndex === 0 ? (
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {typeof row[column.key] === 'string' ? row[column.key].charAt(0).toUpperCase() : '📄'}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {row[column.key] || 'Untitled'}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {column.subtitle ? column.subtitle(row) : ''}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center space-x-2">
                    {columns
                      .filter(col => col.key === 'actions')
                      .map(column => (
                        <div key={column.key}>
                          {column.render ? column.render(null, row, index) : null}
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {paginationInfo.total_pages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(paginationInfo.page - 1)}
                disabled={paginationInfo.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(paginationInfo.page + 1)}
                disabled={paginationInfo.page >= paginationInfo.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {paginationInfo.total === 0 ? 0 : (paginationInfo.page - 1) * paginationInfo.per_page + 1}
                  </span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(paginationInfo.page * paginationInfo.per_page, paginationInfo.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{paginationInfo.total}</span>
                  {' '}results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(paginationInfo.page - 1)}
                  disabled={paginationInfo.page <= 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, paginationInfo.total_pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          paginationInfo.page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(paginationInfo.page + 1)}
                  disabled={paginationInfo.page >= paginationInfo.total_pages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
