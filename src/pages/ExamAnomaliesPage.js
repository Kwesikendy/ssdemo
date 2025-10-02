import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft,
  Clock,
  FileText,
  Play,
  X,
  Eye,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import EnhancedDataTable from '../components/EnhancedDataTable';

const ExamAnomaliesPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [editingAnomaly, setEditingAnomaly] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [editingOcrText, setEditingOcrText] = useState('');
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [llmCheckResult, setLlmCheckResult] = useState(null);
  const [isCheckingLlm, setIsCheckingLlm] = useState(false);
  const [canResolve, setCanResolve] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(new Set());
  const [manualEntryModal, setManualEntryModal] = useState({
    open: false,
    anomalyId: null,
    indexNumber: '',
    pageNumber: ''
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  
  // Use refs to avoid infinite loops
  const anomaliesRef = useRef([]);
  const selectedAnomalyRef = useRef(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/anomalies/exam/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch anomalies');
      }

      const data = await response.json();
      const newAnomalies = data.data || [];
      
      // Check if any anomaly's OCR text has changed (for processing state)
      const hasOcrChanges = newAnomalies.some(newAnomaly => {
        const oldAnomaly = anomaliesRef.current.find(old => old.id === newAnomaly.id);
        return oldAnomaly && oldAnomaly.ocr_text !== newAnomaly.ocr_text;
      });
      
      if (hasOcrChanges) {
        // Clear processing state for all anomalies
        setOcrProcessing(new Set());
        toast.success('OCR text updated successfully!');
        
        // Update selected anomaly if it's one of the changed ones
        if (selectedAnomalyRef.current) {
          const updatedAnomaly = newAnomalies.find(a => a.id === selectedAnomalyRef.current.id);
          if (updatedAnomaly) {
            setSelectedAnomaly(updatedAnomaly);
            setEditingOcrText(updatedAnomaly.ocr_text || '');
            selectedAnomalyRef.current = updatedAnomaly;
          }
        }
      }
      
      setAnomalies(newAnomalies);
      anomaliesRef.current = newAnomalies;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Table handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page, perPage = pagination.per_page) => {
    setPagination(prev => ({ ...prev, page, per_page: perPage }));
  };

  // Filter anomalies based on search and filters
  const filterAnomalies = (anomalyList) => {
    let filtered = [...anomalyList];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(anomaly => 
        anomaly.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anomaly.anomaly_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (anomaly.page_number && anomaly.page_number.toString().includes(searchTerm))
      );
    }
    
    // Apply other filters
    if (filters.severity) {
      filtered = filtered.filter(anomaly => anomaly.severity === filters.severity);
    }
    
    if (filters.status) {
      filtered = filtered.filter(anomaly => anomaly.status === filters.status);
    }
    
    return filtered;
  };

  useEffect(() => {
    if (examId) {
      fetchAnomalies();
    }
  }, [examId]);

  const handleRetryOCR = async (anomalyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [anomalyId]: true }));
      setOcrProcessing(prev => new Set(prev).add(anomalyId));
      
      const response = await fetch(`/api/v1/anomalies/${anomalyId}/retry-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retry OCR');
      }

      toast.success('OCR retry job queued successfully. Processing...');
      
      // Refresh the anomalies list multiple times to show progress
      let refreshCount = 0;
      const maxRefreshes = 10; // 30 seconds total (3 seconds * 10)
      
      const refreshInterval = setInterval(() => {
        refreshCount++;
        fetchAnomalies();
        
        // Stop refreshing after max refreshes or if we detect changes
        if (refreshCount >= maxRefreshes) {
          clearInterval(refreshInterval);
          setOcrProcessing(prev => {
            const newSet = new Set(prev);
            newSet.delete(anomalyId);
            return newSet;
          });
          toast.success('OCR processing completed. Please check the results.');
        }
      }, 3000);
      
    } catch (err) {
      toast.error('Failed to retry OCR: ' + err.message);
      setOcrProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(anomalyId);
        return newSet;
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [anomalyId]: false }));
    }
  };

  const handleResolveAnomaly = async (anomalyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [anomalyId]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution_notes: resolutionNotes || 'Resolved by user'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve anomaly');
      }

      toast.success('Anomaly resolved successfully');
      setEditingAnomaly(null);
      setResolutionNotes('');
      fetchAnomalies();
    } catch (err) {
      toast.error('Failed to resolve anomaly');
    } finally {
      setActionLoading(prev => ({ ...prev, [anomalyId]: false }));
    }
  };

  const handleViewAnomaly = (anomaly) => {
    setSelectedAnomaly(anomaly);
    selectedAnomalyRef.current = anomaly;
    setEditingOcrText(anomaly.ocr_text || '');
    setIsEditingOcr(false);
    setLlmCheckResult(null);
    setCanResolve(false);
  };

  const handleEditOcrText = () => {
    setIsEditingOcr(true);
  };

  const handleSaveOcrText = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [selectedAnomaly.id]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${selectedAnomaly.id}/update-ocr`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ocr_text: editingOcrText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update OCR text');
      }

      toast.success('OCR text updated successfully');
      setIsEditingOcr(false);
      fetchAnomalies();
    } catch (err) {
      toast.error('Failed to update OCR text');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAnomaly.id]: false }));
    }
  };

  const handleCheckWithLLM = async () => {
    try {
      setIsCheckingLlm(true);
      
      const response = await fetch(`/api/v1/anomalies/${selectedAnomaly.id}/check-llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ocr_text: editingOcrText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check anomaly with LLM');
      }

      const result = await response.json();
      
      setLlmCheckResult(result);
      setCanResolve(result.can_resolve);
      
      if (result.can_resolve) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    } catch (err) {
      toast.error('Failed to check anomaly with LLM');
    } finally {
      setIsCheckingLlm(false);
    }
  };

  const handleResolveWithLLM = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [selectedAnomaly.id]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${selectedAnomaly.id}/resolve-llm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ocr_text: editingOcrText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve anomaly with LLM');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Anomaly resolved successfully with LLM');
        setSelectedAnomaly(null);
        setLlmCheckResult(null);
        setCanResolve(false);
        fetchAnomalies();
        // Dispatch event to update navbar count
        window.dispatchEvent(new CustomEvent('anomalyResolved'));
      } else {
        toast.error('LLM could not resolve the anomaly. Please check the OCR text.');
      }
    } catch (err) {
      toast.error('Failed to resolve anomaly with LLM');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAnomaly.id]: false }));
    }
  };

  const handleManualEntry = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [manualEntryModal.anomalyId]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${manualEntryModal.anomalyId}/resolve-manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index_number: manualEntryModal.indexNumber,
          page_number: manualEntryModal.pageNumber
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve anomaly manually');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Anomaly resolved successfully with manual entry');
        setManualEntryModal({ open: false, anomalyId: null, indexNumber: '', pageNumber: '' });
        setSelectedAnomaly(null);
        fetchAnomalies();
        // Dispatch event to update navbar count
        window.dispatchEvent(new CustomEvent('anomalyResolved'));
      } else {
        toast.error('Failed to resolve anomaly manually');
      }
    } catch (err) {
      toast.error('Failed to resolve anomaly manually');
    } finally {
      setActionLoading(prev => ({ ...prev, [manualEntryModal.anomalyId]: false }));
    }
  };

  const getAnomalyTypeIcon = (type) => {
    switch (type) {
      case 'missing_id_or_index': return <FileText className="h-4 w-4" />;
      case 'low_ocr_confidence': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Available filters for the table
  const availableFilters = [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'investigating', label: 'Investigating' },
        { value: 'ignored', label: 'Ignored' }
      ]
    }
  ];

  // Columns for the EnhancedDataTable
  const columns = [
    {
      key: 'anomaly_type',
      title: 'Type',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          {getAnomalyTypeIcon(value)}
          <span className="ml-2 text-sm font-medium text-gray-900">
            {value.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {value}
        </div>
      )
    },
    {
      key: 'severity',
      title: 'Severity',
      sortable: true,
      render: (value) => <SeverityBadge severity={value} size="sm" />
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} size="sm" />
    },
    {
      key: 'page_number',
      title: 'Page',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? `Page ${value}` : '-'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAnomaly(row);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status !== 'resolved' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetryOCR(row.id);
                }}
                disabled={actionLoading[row.id] || ocrProcessing.has(row.id)}
                className={`disabled:opacity-50 ${
                  ocrProcessing.has(row.id) 
                    ? 'text-blue-700' 
                    : 'text-blue-600 hover:text-blue-900'
                }`}
                title={ocrProcessing.has(row.id) ? 'Processing OCR...' : 'Retry OCR'}
              >
                {actionLoading[row.id] || ocrProcessing.has(row.id) ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAnomaly(row.id);
                }}
                className="text-green-600 hover:text-green-900"
                title="Resolve Manually"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // Filter and paginate data
  const filteredData = useMemo(() => {
    return filterAnomalies(anomalies);
  }, [anomalies, searchTerm, filters]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.per_page;
    const end = start + pagination.per_page;
    return filteredData.slice(start, end);
  }, [filteredData, pagination.page, pagination.per_page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading anomalies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Anomalies</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnomalies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/anomalies')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Anomalies</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Anomalies</h1>
              <p className="mt-2 text-gray-600">
                {anomalies.length} {anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected
              </p>
            </div>
            <button
              onClick={fetchAnomalies}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <EnhancedDataTable
          data={paginatedData}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredData.length,
            total_pages: Math.ceil(filteredData.length / pagination.per_page)
          }}
          onPageChange={handlePageChange}
          onSort={handleSort}
          onSearch={handleSearch}
          onFilter={handleFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          searchTerm={searchTerm}
          filters={filters}
          availableFilters={availableFilters}
          title="Exam Anomalies"
          subtitle={`${anomalies.length} ${anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected`}
          showSearch={true}
          showFilters={true}
          showPagination={true}
          showPerPageSelector={true}
          emptyStateIcon="✅"
          emptyStateMessage="No anomalies found. This exam has no anomalies detected."
          onRefresh={fetchAnomalies}
        />
      </div>

      {/* Resolution Modal */}
      {editingAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resolve Anomaly</h3>
              <button
                onClick={() => {
                  setEditingAnomaly(null);
                  setResolutionNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe how this anomaly was resolved..."
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingAnomaly(null);
                  setResolutionNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveAnomaly(editingAnomaly)}
                disabled={actionLoading[editingAnomaly]}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading[editingAnomaly] ? (
                  <LoadingSpinner size="sm" text="Resolving..." />
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Anomaly Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getAnomalyTypeIcon(selectedAnomaly.anomaly_type)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAnomaly.anomaly_type.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <SeverityBadge severity={selectedAnomaly.severity} size="sm" />
                    <StatusBadge status={selectedAnomaly.status} size="sm" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Image Section */}
                <div className="space-y-4">
                  <h4 className="text-sm sm:text-md font-medium text-gray-900">Page Image</h4>
                  {selectedAnomaly.page_blob_url ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={selectedAnomaly.page_blob_url}
                        alt="Page content"
                        className="w-full h-auto max-h-64 sm:max-h-96 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 sm:p-8 text-center text-gray-500">
                      <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
                      <p className="text-sm sm:text-base">No image available</p>
                    </div>
                  )}
                </div>

                {/* OCR Text Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900">OCR Text</h4>
                    {!isEditingOcr && (
                      <button
                        onClick={handleEditOcrText}
                        className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                      >
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                  </div>
                  
                  {isEditingOcr ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingOcrText}
                        onChange={(e) => setEditingOcrText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={8}
                        placeholder="Enter OCR text..."
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveOcrText}
                          disabled={actionLoading[selectedAnomaly.id]}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {actionLoading[selectedAnomaly.id] ? (
                            <LoadingSpinner size="sm" text="" />
                          ) : (
                            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingOcr(false);
                            setEditingOcrText(selectedAnomaly.ocr_text || '');
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 max-h-48 sm:max-h-64 overflow-y-auto">
                      <pre className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap font-mono">
                        {selectedAnomaly.ocr_text || 'No OCR text available'}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Description and Metadata */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedAnomaly.description}</p>
                </div>

                {selectedAnomaly.resolution_notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Resolution Notes</h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                      {selectedAnomaly.resolution_notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedAnomaly.created_at).toLocaleString()}
                  </div>
                  {selectedAnomaly.page_number && (
                    <div>
                      <span className="font-medium">Page:</span> {selectedAnomaly.page_number}
                    </div>
                  )}
                  {selectedAnomaly.candidate_index_number && (
                    <div>
                      <span className="font-medium">Candidate:</span> {selectedAnomaly.candidate_index_number}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LLM Check Results */}
            {llmCheckResult && (
              <div className="flex-shrink-0 p-4 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${canResolve ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {canResolve ? 'Ready to Resolve' : 'Cannot Resolve'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">{llmCheckResult.message}</p>
                {llmCheckResult.extracted_data && Object.keys(llmCheckResult.extracted_data).length > 0 && (
                  <div className="text-xs sm:text-sm text-gray-600">
                    <strong>Extracted Data:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(llmCheckResult.extracted_data).map(([key, value]) => (
                        <li key={key} className="capitalize">
                          {key.replace('_', ' ')}: {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleRetryOCR(selectedAnomaly.id)}
                  disabled={actionLoading[selectedAnomaly.id] || ocrProcessing.has(selectedAnomaly.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg disabled:opacity-50 text-sm sm:text-base ${
                    ocrProcessing.has(selectedAnomaly.id) 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {actionLoading[selectedAnomaly.id] || ocrProcessing.has(selectedAnomaly.id) ? (
                    <LoadingSpinner size="sm" text="" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {ocrProcessing.has(selectedAnomaly.id) ? 'Processing OCR...' : 'Retry OCR'}
                  </span>
                  <span className="sm:hidden">
                    {ocrProcessing.has(selectedAnomaly.id) ? 'Processing...' : 'Retry'}
                  </span>
                </button>
                    <button
                      onClick={handleCheckWithLLM}
                      disabled={isCheckingLlm || actionLoading[selectedAnomaly.id]}
                      className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 text-sm sm:text-base"
                    >
                      {isCheckingLlm ? (
                        <LoadingSpinner size="sm" text="" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Check with LLM</span>
                      <span className="sm:hidden">Check LLM</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setSelectedAnomaly(null)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                    >
                      Close
                    </button>
                    {selectedAnomaly.status !== 'resolved' && (
                      <>
                        <button
                          onClick={() => handleResolveWithLLM()}
                          disabled={actionLoading[selectedAnomaly.id] || !canResolve}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg disabled:opacity-50 text-sm sm:text-base ${
                            canResolve 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        >
                          {actionLoading[selectedAnomaly.id] ? (
                            <LoadingSpinner size="sm" text="" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Resolve Now</span>
                          <span className="sm:hidden">Resolve</span>
                        </button>
                        <button
                          onClick={() => {
                            setManualEntryModal({
                              open: true,
                              anomalyId: selectedAnomaly.id,
                              indexNumber: selectedAnomaly.candidate_index_number || '',
                              pageNumber: selectedAnomaly.page_number || ''
                            });
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                        >
                          <span className="hidden sm:inline">Manually Enter Values</span>
                          <span className="sm:hidden">Manual Entry</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {manualEntryModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manually Enter Values</h3>
              <button
                onClick={() => setManualEntryModal({ open: false, anomalyId: null, indexNumber: '', pageNumber: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Index Number
                </label>
                <input
                  type="text"
                  value={manualEntryModal.indexNumber}
                  onChange={(e) => setManualEntryModal(prev => ({ ...prev, indexNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter candidate index number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Number
                </label>
                <input
                  type="number"
                  value={manualEntryModal.pageNumber}
                  onChange={(e) => setManualEntryModal(prev => ({ ...prev, pageNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter page number"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setManualEntryModal({ open: false, anomalyId: null, indexNumber: '', pageNumber: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleManualEntry}
                disabled={actionLoading[manualEntryModal.anomalyId] || !manualEntryModal.indexNumber || !manualEntryModal.pageNumber}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading[manualEntryModal.anomalyId] ? (
                  <LoadingSpinner size="sm" text="Saving..." />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAnomaliesPage;
