import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, UploadCloud, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import EnhancedDataTable from '../components/EnhancedDataTable';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingProgressBar from '../components/LoadingProgressBar';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function GroupUploadsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [group, setGroup] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // Mode is always 'images' - PDF support removed
  const mode = 'images';
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const pollRef = useRef(null);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    fetchCandidates();
  }, [groupId, pagination.page, pagination.per_page, searchTerm, filters, sortField, sortDirection]);

  useEffect(() => {
    // Poll while there are candidates being processed
    const hasProcessing = candidates.some(c => c.page_count === 0 || c.bound_pages < c.page_count);
    if (hasProcessing){
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(()=>{ fetchCandidates(false); }, 4000);
    } else if (pollRef.current){
      clearInterval(pollRef.current);
    }
    return () => { if(pollRef.current) clearInterval(pollRef.current); };
  }, [candidates]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      const body = res.data;
      setGroup(body.data || body);
    } catch (e) {
      console.error('Failed to fetch group', e);
      toast.error('Failed to load group information');
    }
  };

  const fetchCandidates = async (showLoader = true) => {
    try {
      if(showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params = { 
        page: pagination.page, 
        per_page: pagination.per_page,
        search: searchTerm,
        sort_by: sortField,
        sort_order: sortDirection,
        ...filters
      };
      const res = await api.get(`/groups/${groupId}/candidates`, { params });
      const body = res.data;
      let rows = body.data?.candidates || body.candidates || [];
      const meta = body.data?.pagination || body.pagination || null;
      if (meta) {
        const total = rows.length;
        const start = (pagination.page - 1) * pagination.per_page;
        setCandidates(rows.slice(start, start + pagination.per_page));
        setPagination(prev => ({ ...prev, total, total_pages: Math.ceil(total / prev.per_page) }));
      } else {
        setCandidates(rows);
      }
      setError(null);
    } catch (e) {
      console.error('Failed to fetch candidates', e);
      const errorMsg = 'Failed to fetch candidates for this group.';
      setError(errorMsg);
      if (!showLoader) {
        toast.error(errorMsg);
      }
    } finally {
      if(showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const handleDelete = async (uploadId) => {
    if (!window.confirm('Delete this upload? This will remove all pages.')) return;
    try {
      toast.info('Deleting upload...');
      await api.delete(`/uploads/${uploadId}`);
      toast.success('Upload deleted successfully');
      fetchCandidates();
    } catch (e) {
      console.error('Delete failed', e);
      const errorMsg = 'Failed to delete upload.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleOpenUpload = () => setIsUploadOpen(true);
  const handleCloseUpload = () => {
    setIsUploadOpen(false);
    setFiles([]);
    setIsSubmitting(false);
    setUploadProgress(0);
  };

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

  const availableFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' }
      ]
    },
    {
      key: 'page_count_min',
      label: 'Min Pages',
      type: 'number'
    },
    {
      key: 'page_count_max',
      label: 'Max Pages',
      type: 'number'
    }
  ];

  const handleSubmitUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      const errorMsg = 'Please choose at least one file to upload.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      toast.info(`Uploading ${files.length} file(s)...`);
      
      const form = new FormData();
      // backend CreateUpload expects multipart with files[]
      for (const f of files) form.append('files', f);
      
      // Simulate progress for better UX (since we don't have actual progress from API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 80) return prev + 10;
          return prev + 2;
        });
      }, 200);
      
      // Use group endpoint; backend will tie to the group's exam automatically
      await api.post(`/groups/${groupId}/uploads?mode=${encodeURIComponent(mode)}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success(`Successfully uploaded ${files.length} file(s)! Processing will begin automatically.`);
      handleCloseUpload();
      await fetchCandidates();
      
      // Check for anomalies after upload
      try {
        const anomalyResponse = await api.get('/anomalies');
        const anomalies = anomalyResponse.data.data?.anomalies || [];
        if (anomalies.length > 0) {
          toast.warning(`Upload completed with ${anomalies.length} anomaly(ies) detected. Please review and resolve them.`);
        }
      } catch (err) {
        console.log('Could not check for anomalies:', err);
        // Don't show error toast for this, as it's not critical
      }
    } catch (e) {
      console.error('Upload failed', e);
      const errorMsg = 'Upload failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      key: 'index_number',
      title: 'Candidate',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-green-600">
                {value ? value.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <button
              onClick={() => navigate(`/candidates/${row.id}/pages`)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline text-left"
            >
              {value || 'Unknown Candidate'}
            </button>
            <div className="text-xs text-gray-500">ID: {row.id.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    { 
      key: 'page_count', 
      title: 'Pages', 
      sortable: true,
      render: (value, row) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">
            {row.bound_pages || 0} bound
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true,
      render: (v, row) => {
        const isComplete = row.page_count > 0 && row.bound_pages === row.page_count;
        const isProcessing = row.page_count === 0 || row.bound_pages < row.page_count;
        
        return (
          <div className="space-y-1">
            <StatusBadge 
              status={isComplete ? 'completed' : isProcessing ? 'processing' : 'pending'} 
              type="upload" 
            />
            {isProcessing && (
              <div className="text-xs text-gray-500">Processing pages...</div>
            )}
          </div>
        );
      }
    },
    { key: 'created_at', title: 'Created', sortable: true, render: (v) => <span>{formatDate(v)}</span> },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/candidates/${row.id}/pages`)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="View Pages"
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && candidates.length === 0} />
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/uploads')} className="mr-3 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group ? group.name : 'Group'} Candidates</h1>
            <p className="text-gray-600">View and manage candidates for this group</p>
          </div>
          <div className="ml-auto flex items-center space-x-3">
            <button
              onClick={() => fetchCandidates(false)}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleOpenUpload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UploadCloud className="h-4 w-4 mr-2" /> Upload scripts
            </button>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <EnhancedDataTable
            data={candidates}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            onFilter={handleFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            searchTerm={searchTerm}
            filters={filters}
            availableFilters={availableFilters}
            title="Group Candidates"
            subtitle={`${candidates.length} candidates in this group`}
            showSearch={true}
            showFilters={true}
            showPagination={true}
            showPerPageSelector={true}
            emptyStateIcon="👥"
            emptyStateMessage="No candidates found. Upload some scripts to get started."
            onRefresh={fetchCandidates}
            refreshLoading={refreshing}
          />
        </div>

        <Modal isOpen={isUploadOpen} onClose={handleCloseUpload} title="Upload images to this group" size="md">
          <form onSubmit={handleSubmitUpload} className="space-y-4">
            {/* Mode is always 'images' - PDF support removed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Files</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              {files && files.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">{files.length} files selected</p>
              )}
            </div>
            {isSubmitting && (
              <div className="mt-4">
                <LoadingProgressBar 
                  progress={uploadProgress} 
                  label="Uploading files..." 
                  variant="blue"
                />
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={handleCloseUpload} disabled={isSubmitting} className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
