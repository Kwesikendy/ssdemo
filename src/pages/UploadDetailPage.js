import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import EnhancedDataTable from '../components/EnhancedDataTable';

export default function UploadDetailPage(){
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [upload, setUpload] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('page_no');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => { fetchData(); }, [uploadId]);

  async function fetchData(){
    try{
      setLoading(true);
      console.log('Fetching upload data for ID:', uploadId);
      const ures = await api.get(`/uploads/${uploadId}`);
      const ubody = ures.data;
      setUpload(ubody.data || ubody);
      console.log('Upload data:', ubody.data || ubody);
      
      console.log('Fetching pages for upload ID:', uploadId);
      const pres = await api.get(`/uploads/${uploadId}/pages`, { params: { page: 1, per_page: 100 } });
      const pbody = pres.data;
      console.log('Pages API response:', pbody);
      // Handle both cases: when pages is null or when it's an empty array
      const pagesData = pbody.data?.pages || pbody.pages;
      const rows = pagesData === null ? [] : (pagesData || []);
      console.log('Pages rows:', rows);
      setPages(rows);
      setError(null);
    }catch(e){
      console.error('Failed to fetch upload detail', e);
      const errorMsg = 'Failed to load upload details.';
      setError(errorMsg);
      toast.error(errorMsg);
    }finally{
      setLoading(false);
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const columns = [
    {
      key: 'id',
      title: 'Page Name',
      sortable: true,
      render: (value) => (
        <span className="text-indigo-600 font-medium text-sm">
          Image {value.substring(0, 8)}
        </span>
      )
    },
    {
      key: 'page_no',
      title: 'Page #',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value || 'Unknown'}</span>
      )
    },
    {
      key: 'upload_status',
      title: 'Upload Status',
      sortable: true,
      render: (value) => <StatusBadge status={value || 'pending'} type="upload" />
    },
    {
      key: 'ocr_status',
      title: 'OCR Status',
      sortable: true,
      render: (value) => <StatusBadge status={value || 'pending'} type="ocr" />
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <span className="text-indigo-600 font-medium text-sm">
          View Details →
        </span>
      )
    }
  ];

  const availableFilters = [
    {
      key: 'upload_status',
      label: 'Upload Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' }
      ]
    },
    {
      key: 'ocr_status',
      label: 'OCR Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && !upload} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-3 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Upload Detail</h1>
            <p className="text-gray-600">View page images and OCR text, edit text or redo OCR.</p>
            {upload && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-500">File: {upload.original_filename || upload.filename}</span>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={upload.upload_status || upload.status} type="upload" />
                  <StatusBadge status={upload.ocr_status || 'pending'} type="ocr" />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Pages table - main content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Upload Pages</h2>
            <div className="text-sm text-gray-500">
              Total: {pages.length} pages
            </div>
          </div>
          
          <EnhancedDataTable
            data={pages}
            columns={columns}
            loading={loading}
            onSort={handleSort}
            onSearch={handleSearch}
            onFilter={handleFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            searchTerm={searchTerm}
            filters={filters}
            availableFilters={availableFilters}
            title="Upload Pages"
            subtitle={`${pages.length} pages in this upload`}
            showSearch={true}
            showFilters={true}
            showPagination={false}
            showPerPageSelector={false}
            emptyStateIcon="📄"
            emptyStateMessage="No pages found for this upload."
          />
        </div>
      </div>
    </div>
  );
}
