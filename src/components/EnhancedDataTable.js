import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  Filter, 
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';

export default function EnhancedDataTable({ 
  data = [], 
  columns = [], 
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onSort = () => {},
  onSearch = () => {},
  onFilter = () => {},
  sortField = null,
  sortDirection = 'asc',
  searchTerm = '',
  filters = {},
  availableFilters = [],
  className = '',
  title = 'Data Table',
  subtitle = '',
  showSearch = true,
  showFilters = true,
  showPagination = true,
  showPerPageSelector = true,
  emptyStateIcon = '📄',
  emptyStateMessage = 'No data available',
  onRefresh = null,
  refreshLoading = false,
  bulkActions = [],
  onBulkSelect = null,
  onRowSelect = null,
  selectedRows = {}
}) {
  const [internalSelectedRows, setInternalSelectedRows] = useState(selectedRows || {});
  const [localSortField, setLocalSortField] = useState(sortField);
  const [localSortDirection, setLocalSortDirection] = useState(sortDirection);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [perPage, setPerPage] = useState(pagination?.per_page || 10);

  // Update local state when props change
  useEffect(() => {
    setLocalSortField(sortField);
    setLocalSortDirection(sortDirection);
    setLocalSearchTerm(searchTerm);
    setLocalFilters(filters);
  }, [sortField, sortDirection, searchTerm, filters]);

  const handleSelectAll = (checked) => {
    if (onBulkSelect) {
      onBulkSelect(checked);
    } else {
      if (checked) {
        const allSelected = {};
        data.forEach((_, index) => {
          allSelected[index] = true;
        });
        setInternalSelectedRows(allSelected);
      } else {
        setInternalSelectedRows({});
      }
    }
  };

  const handleSelectRow = (index, checked) => {
    if (onRowSelect) {
      onRowSelect(index, checked);
    } else {
      const newSelected = { ...internalSelectedRows };
      if (checked) {
        newSelected[index] = true;
      } else {
        delete newSelected[index];
      }
      setInternalSelectedRows(newSelected);
    }
  };

  const handleSort = (field) => {
    const effectiveField = localSortField;
    const effectiveDir = localSortDirection;
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

  const handleSearch = (term) => {
    setLocalSearchTerm(term);
    onSearch && onSearch(term);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);
    onFilter && onFilter(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilter && onFilter({});
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    onSearch && onSearch('');
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    if (pagination) {
      onPageChange && onPageChange(1, newPerPage);
    }
  };

  const effectiveSortField = localSortField;
  const effectiveSortDirection = localSortDirection;

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

  const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== 'all' && v !== '').length;

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
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            {showSearch && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search..."
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {localSearchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && availableFilters.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    activeFiltersCount > 0
                      ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Per Page Selector */}
            {showPerPageSelector && pagination && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
            )}
          </div>

          {/* Filter Panel */}
          {showFilterPanel && availableFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFilters.map((filter) => (
                  <div key={filter.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {filter.label}
                    </label>
                    {filter.type === 'select' ? (
                      <select
                        value={localFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">All {filter.label}</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : filter.type === 'date' ? (
                      <input
                        type="date"
                        value={localFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={localFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        placeholder={`Filter by ${filter.label.toLowerCase()}...`}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {bulkActions.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {Object.keys(internalSelectedRows).filter(key => internalSelectedRows[key]).length} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {bulkActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={action.disabled}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                      action.variant === 'primary'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 mr-1.5" />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {bulkActions.length > 0 && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={Object.keys(internalSelectedRows).filter(key => internalSelectedRows[key]).length === data.length && data.length > 0}
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
                    {column.sortable && (
                      <span className="text-gray-400">
                        {effectiveSortField === column.key ? (
                          effectiveSortDirection === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
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
                      <span className="text-gray-400 text-xl">{emptyStateIcon}</span>
                    </div>
                    <p>{emptyStateMessage}</p>
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
                  {bulkActions.length > 0 && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={internalSelectedRows[index] || false}
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
      {showPagination && pagination && (
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
