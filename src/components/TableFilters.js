import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';

export default function TableFilters({
  filters = {},
  availableFilters = [],
  onFilterChange = () => {},
  onClearFilters = () => {},
  className = ''
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (filterKey) => {
    const newFilters = { ...localFilters };
    delete newFilters[filterKey];
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== 'all' && v !== '').length;

  if (availableFilters.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Filters</h3>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="space-y-4">
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
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={localFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  ) : filter.type === 'dateRange' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          value={localFilters[`${filter.key}_from`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          value={localFilters[`${filter.key}_to`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  ) : filter.type === 'number' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Min</label>
                        <input
                          type="number"
                          value={localFilters[`${filter.key}_min`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                          placeholder="Min"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max</label>
                        <input
                          type="number"
                          value={localFilters[`${filter.key}_max`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                          placeholder="Max"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={localFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={`Filter by ${filter.label.toLowerCase()}...`}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  )}

                  {/* Clear individual filter */}
                  {localFilters[filter.key] && localFilters[filter.key] !== '' && (
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear {filter.label}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(localFilters).map(([key, value]) => {
                    if (!value || value === 'all' || value === '') return null;
                    const filter = availableFilters.find(f => f.key === key);
                    if (!filter) return null;
                    
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {filter.label}: {value}
                        <button
                          onClick={() => clearFilter(key)}
                          className="ml-1 text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
