import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, UploadCloud, RefreshCw, Eye, Trash2, Edit3, Loader2 } from 'lucide-react';
import CardTable from '../components/CardTable';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingProgressBar from '../components/LoadingProgressBar';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import useBatchOperations from '../hooks/useBatchOperations';
import StatusIcon from '../components/StatusIcon';
import { getStatusColor, formatStatus, isProcessing } from '../utils/statusUtils';

export default function GroupUploadsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [exam, setExam] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mode, setMode] = useState('images');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchName, setBatchName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const pollRef = useRef(null);
  
  // Use custom hooks
  const { deletingBatch, handleViewBatch, handleDeleteBatch, handleGoToMarkBatch } = useBatchOperations(groupId);


  const fetchExam = useCallback(async () => {
    try {
      const res = await api.get(`/exams/${groupId}`);
      const body = res.data;
      const examData = body.data || body;
      console.log('Fetched exam:', examData);
      setExam(examData);
    } catch (e) {
      console.error('Failed to fetch group', e);
      toast.error('Failed to load group information');
    }
  }, [groupId, toast]);

  const fetchUploads = useCallback(async (showLoader = true) => {
    try {
      if(showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      console.log('fetchUploads called with exam:', exam);
      
      // For simple exams, use the new exam scripts endpoint to get individual images
      if (exam && exam.exam_type === 'simple') {
        const params = { page: pagination.page, per_page: pagination.per_page };
        const res = await api.get(`/exams/${groupId}/scripts`, { params });
        const body = res.data;
        let uploads = body.data?.uploads || body.uploads || [];
        
        // Flatten uploads with pages into individual page items
        let pageItems = [];
        uploads.forEach(upload => {
          if (upload.pages && upload.pages.length > 0) {
            upload.pages.forEach(page => {
              pageItems.push({
                id: page.id,
                upload_id: upload.id,
                original_filename: upload.original_filename,
                display_name: upload.display_name,
                mode: upload.mode,
                status: page.status,
                upload_status: upload.upload_status,
                ocr_status: page.ocr_status || 'pending',
                created_at: page.created_at,
                page_no: page.page_no,
                blob_url: page.blob_url,
                candidate_id: page.candidate_id,
                type: 'page' // Mark this as a page item
              });
            });
          }
        });
        
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          pageItems = pageItems.filter(item => (
            (item.original_filename || '').toLowerCase().includes(q) ||
            (item.mode || '').toLowerCase().includes(q) ||
            (item.status || '').toLowerCase().includes(q) ||
            (item.ocr_status || '').toLowerCase().includes(q)
          ));
        }
        
        const meta = body.data?.pagination || body.pagination || {};
        setPagination(prev => ({ 
          ...prev, 
          total: meta.total || pageItems.length, 
          total_pages: meta.total_pages || Math.ceil(pageItems.length / prev.per_page) 
        }));
        setUploads(pageItems);
        setBatches([]);
      } else if (exam && exam.exam_type === 'batch') {
        // For batch exams, get batches
        console.log('Fetching batches for exam:', groupId, 'exam type:', exam.exam_type);
        try {
          const res = await api.get(`/exams/${groupId}/batches`);
          const body = res.data;
          console.log('Batches response:', body);
          let batchItems = body.batches || [];
          
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            batchItems = batchItems.filter(batch => 
              batch.name.toLowerCase().includes(q)
            );
          }
          
          setBatches(batchItems);
          setUploads([]);
        } catch (error) {
          console.error('Error fetching batches:', error);
          if (error.response?.status === 400) {
            console.error('400 Bad Request - Exam might not exist or have wrong type');
            toast.error('Failed to fetch batches. Exam might not be configured for batch processing.');
          } else {
            throw error; // Re-throw to be caught by outer catch
          }
        }
      } else {
        // For multi exams, use the regular batch-uploads endpoint
        const params = { page: pagination.page, per_page: pagination.per_page, group_id: groupId };
        const res = await api.get('/batch-uploads', { params });
        const body = res.data;
        let rows = body.data?.uploads || body.uploads || [];
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          rows = rows.filter(u => (
            (u.original_filename || u.filename || '').toLowerCase().includes(q) ||
            (u.mode || '').toLowerCase().includes(q) ||
            (u.upload_status || u.status || '').toLowerCase().includes(q) ||
            (u.ocr_status || '').toLowerCase().includes(q)
          ));
        }
        const meta = body.data?.pagination || body.pagination || null;
        if (meta) {
          const total = rows.length;
          const start = (pagination.page - 1) * pagination.per_page;
          setUploads(rows.slice(start, start + pagination.per_page));
          setPagination(prev => ({ ...prev, total, total_pages: Math.ceil(total / prev.per_page) }));
        } else {
          setUploads(rows);
        }
        setBatches([]);
      }
      setError(null);
    } catch (e) {
      console.error('Failed to fetch uploads', e);
      const errorMsg = 'Failed to fetch uploads for this group.';
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
  }, [exam, groupId, searchTerm, pagination.page, pagination.per_page, toast]);

  useEffect(() => {
    fetchExam();
  }, [groupId]);

  useEffect(() => {
    // Only fetch uploads after exam is loaded to know the exam type
      if (exam) {
        fetchUploads();
      }
  }, [groupId, pagination.page, pagination.per_page, exam]);

  useEffect(() => {
    // Poll while there are uploads processing
    const hasProcessing = uploads.some(u => isProcessing(u.status));
    if (hasProcessing){
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(()=>{ fetchUploads(false); }, 4000);
    } else if (pollRef.current){
      clearInterval(pollRef.current);
    }
    return () => { if(pollRef.current) clearInterval(pollRef.current); };
  }, [uploads]);

  const handleDelete = async (uploadId) => {
    if (!window.confirm('Delete this upload? This will remove all pages.')) return;
    try {
      toast.info('Deleting upload...');
      await api.delete(`/batch-uploads/${uploadId}`);
      toast.success('Upload deleted successfully');
      fetchUploads();
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
    setBatchName('');
  };

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
      
      // Build URL with parameters
      let url = `/exams/${groupId}/uploads?mode=${encodeURIComponent(mode)}`;
      if (exam && exam.exam_type === 'batch' && batchName.trim()) {
        url += `&batch_name=${encodeURIComponent(batchName.trim())}`;
      }
      
      // Use exam endpoint; backend will tie to the exam automatically
      const res = await api.post(url, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`Successfully uploaded ${files.length} file(s)! Processing will begin automatically.`);
      const created = res?.data?.data?.created_upload_ids || res?.data?.created_upload_ids || null;
      handleCloseUpload();
      fetchUploads();
      
      // Handle redirect based on exam type
      if (exam && exam.exam_type === 'batch' && batchName.trim()) {
        // For batch exams, redirect to the batch details page
        navigate(`/uploads/group/${groupId}/batch/${encodeURIComponent(batchName.trim())}`);
      } else if (exam && exam.exam_type === 'simple' && created && Array.isArray(created) && created.length > 0) {
        // For simple exams, redirect to the simple upload details page
        navigate(`/uploads/group/${groupId}/upload/${created[0]}`);
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


  // Batch columns
  const batchColumns = [
    {
      key: 'name',
      title: 'Batch Name',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
              onClick={() => handleViewBatch(value)}
              title="Click to view batch details"
            >
              {value || 'Unnamed Batch'}
            </div>
            <div className="text-xs text-gray-500">
              {row.image_count || 0} images • {row.upload_count || 0} uploads
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'marking_status',
      title: 'Marking Status',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <StatusIcon status={value} />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
            {formatStatus(value)}
          </span>
        </div>
      )
    },
    { 
      key: 'created_at', 
      title: 'Created', 
      render: (v) => <span className="text-sm text-gray-600">{formatDate(v)}</span> 
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewBatch(row.name)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
            title="View Batch Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleGoToMarkBatch(row.name)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Go to Mark"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteBatch(row.name).then(success => success && fetchUploads())}
            disabled={deletingBatch === row.name}
            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete Batch"
          >
            {deletingBatch === row.name ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )
    },
  ];

  // Regular columns for simple groups and other types
  const columns = [
    {
      key: 'original_filename',
      title: exam && exam.exam_type === 'simple' ? 'Image' : 'File',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {row.type === 'page' ? 
                `Image ${row.id.slice(0, 8)}...` : 
                (row.display_name || value || row.filename || 'Upload')
              }
            </div>
            <div className="text-xs text-gray-500">
              Mode: {row.mode}
              {row.candidate_id && <span className="ml-2">• Candidate: {row.candidate_id}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'ocr_status',
      title: 'OCR Status',
      render: (value, row) => {
        const isOCRFailed = row.ocr_status === 'failed';
        
        return (
          <div className="flex items-center space-x-2">
            {isOCRFailed ? (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">Failure</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Success</span>
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'created_at', title: 'Created', render: (v) => <span>{formatDate(v)}</span> },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (row.type === 'page') {
                // For pages, navigate to the simple upload details page
                navigate(`/uploads/group/${groupId}/upload/${row.upload_id}`);
              } else {
                navigate(`/uploads/group/${groupId}/upload/${row.id}`);
              }
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="View"
          >
            <Upload className="h-4 w-4" />
          </button>
          {row.type !== 'page' && (
            <button
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
              title="Delete"
            >
              {/* simple X icon using SVG to avoid new imports */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && uploads.length === 0} />
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/uploads')} className="mr-3 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {exam ? exam.name : 'Group'} {exam && exam.exam_type === 'simple' ? 'Images' : 'Uploads'}
            </h1>
            <p className="text-gray-600">
              {exam && exam.exam_type === 'simple' 
                ? 'View and manage individual images for this group' 
                : 'View and manage uploads for this group'
              }
            </p>
          </div>
          <div className="ml-auto flex items-center space-x-3">
            <button
              onClick={() => fetchUploads(false)}
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
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search {exam && exam.exam_type === 'simple' ? 'images' : 'uploads'}
              </label>
              <input 
                value={searchTerm} 
                onChange={(e)=>{ setSearchTerm(e.target.value); setPagination(p=>({ ...p, page: 1 })); }} 
                placeholder={`Search by ${exam && exam.exam_type === 'simple' ? 'image' : 'file'}, mode, or status...`} 
                className="w-full border rounded-md px-3 py-2 text-sm" 
              />
            </div>
          </div>
          <CardTable
            data={exam && exam.exam_type === 'batch' ? batches : uploads}
            columns={exam && exam.exam_type === 'batch' ? batchColumns : columns}
            loading={loading}
            searchable={true}
            selectable={true}
            onSelectionChange={setSelectedItems}
            searchPlaceholder={
              exam && exam.exam_type === 'batch' 
                ? 'Search batches...' 
                : exam && exam.exam_type === 'simple' 
                  ? 'Search images...' 
                  : 'Search uploads...'
            }
            searchFields={['name', 'original_filename', 'display_name']}
            bulkActions={[
              {
                label: 'Delete Selected',
                variant: 'danger',
                icon: Trash2,
                onClick: (selected) => {
                  console.log('Delete selected items:', selected);
                }
              }
            ]}
            emptyMessage={
              exam && exam.exam_type === 'batch' 
                ? 'No batches found in this exam' 
                : exam && exam.exam_type === 'simple' 
                  ? 'No images found in this exam' 
                  : 'No uploads found in this exam'
            }
          />
        </div>

  <Modal isOpen={isUploadOpen} onClose={handleCloseUpload} title="Upload scripts to this exam" size="md">
          <form onSubmit={handleSubmitUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="mode" value="images" checked={mode === 'images'} onChange={() => setMode('images')} className="text-indigo-600 border-gray-300" />
                  <span className="ml-2">Images</span>
                </label>
                <label className="inline-flex items-center opacity-50 cursor-not-allowed">
                  <input type="radio" name="mode" value="pdfs" checked={mode === 'pdfs'} onChange={() => setMode('pdfs')} className="text-indigo-600 border-gray-300" disabled />
                  <span className="ml-2">PDFs <span className="text-xs text-gray-500">(Coming Soon)</span></span>
                </label>
              </div>
            </div>
            {exam && exam.exam_type === 'batch' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name (Optional)</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., 1st batch, 2nd batch, etc."
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">Give this batch a name to identify it later</p>
              </div>
            )}
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
