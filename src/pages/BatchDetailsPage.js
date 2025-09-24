import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  Trash2, 
  Edit3, 
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import CardTable from '../components/CardTable';
import LoadingOverlay from '../components/LoadingOverlay';
import useImageOperations from '../hooks/useImageOperations';
import { isProcessing } from '../utils/statusUtils';

const BatchDetailsPage = () => {
  const { groupId, batchName } = useParams();
  const navigate = useNavigate();
  const { success, error: showError, info } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [images, setImages] = useState([]);
  const [redoingOCR, setRedoingOCR] = useState(null);
  
  // Batch name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  const pollRef = useRef(null);
  
  // Fetch batch details
  const fetchBatchDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

        const response = await api.get(`/groups/${groupId}/batches/details?batch_name=${encodeURIComponent(batchName)}`);
        const data = response.data;
        
      
      setBatchInfo({
        batchName: data.batch_name,
        uploadCount: data.upload_count,
        imageCount: data.image_count
      });
      
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to fetch batch details', err);
      const errorMsg = 'Failed to fetch batch details.';
      setError(errorMsg);
      if (!showLoader) {
        showError(errorMsg);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [groupId, batchName, showError]);

  // Use custom hooks
  const { deletingImage, handleDeleteImage } = useImageOperations(fetchBatchDetails);

  // Handle batch name editing
  const handleEditName = () => {
    setIsEditingName(true);
    setNewBatchName(batchInfo?.batchName || '');
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewBatchName('');
  };

  const handleSaveName = async () => {
    if (!newBatchName.trim()) {
      showError('Batch name cannot be empty');
      return;
    }

    if (newBatchName.trim() === batchInfo?.batchName) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      await api.put(`/groups/${groupId}/batch-name`, {
        old_batch_name: batchInfo?.batchName,
        new_batch_name: newBatchName.trim()
      });

      success('Batch name updated successfully');
      setIsEditingName(false);
      
      // Update the batch info
      setBatchInfo(prev => ({
        ...prev,
        batchName: newBatchName.trim()
      }));

      // Update the URL to reflect the new batch name
      const newBatchNameEncoded = encodeURIComponent(newBatchName.trim());
      navigate(`/uploads/group/${groupId}/batch/${newBatchNameEncoded}`, { replace: true });
      
    } catch (err) {
      console.error('Failed to update batch name:', err);
      showError('Failed to update batch name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  // Auto-refresh while processing
  useEffect(() => {
    const hasProcessing = images.some(img => isProcessing(img.status));
    
    if (hasProcessing) {
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchBatchDetails(false);
      }, 4000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [images]);

  useEffect(() => {
    fetchBatchDetails();
  }, [groupId, batchName]);

  // Handle image view
  const handleViewImage = (image) => {
    navigate(`/uploads/group/${groupId}/batch/${encodeURIComponent(batchName)}/image/${image.id}`);
  };


  // Handle redo OCR
  const handleRedoOCR = async (pageId) => {
    if (!window.confirm('Redo OCR for this image? This will replace the current OCR text.')) return;
    
    try {
      setRedoingOCR(pageId);
      info('Queuing OCR job...');
      
      await api.post(`/groups/pages/${pageId}/redo-ocr`);
      
      success('OCR job queued successfully. Processing will begin shortly.');
      
      // Refresh the data to show updated status
      await fetchBatchDetails(false);
      
      // Set up polling to check for OCR completion
      const pollInterval = setInterval(async () => {
        try {
          await fetchBatchDetails(false);
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000); // Poll every 2 seconds
      
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);
    } catch (err) {
      console.error('Failed to queue OCR job', err);
      showError('Failed to queue OCR job');
    } finally {
      setRedoingOCR(null);
    }
  };

  // Handle batch deletion
  const handleDeleteBatch = async () => {
    if (!window.confirm('Delete entire batch? This will remove all images in this batch.')) return;
    
    try {
      info('Deleting batch...');
      // TODO: Implement batch deletion endpoint
      success('Batch deleted successfully');
      navigate(`/uploads/group/${groupId}`);
    } catch (err) {
      console.error('Failed to delete batch', err);
      showError('Failed to delete batch');
    }
  };

  // Handle go to marking
  const handleGoToMark = () => {
    // TODO: Navigate to marking page for this batch
    info('Marking functionality coming soon');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };


  // Table columns for images
  const imageColumns = [
    {
      key: 'image_info',
      title: 'Image',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
              onClick={() => handleViewImage(row)}
              title="Click to view image details"
            >
              Image {row.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-gray-500">
              Created {formatDate(row.created_at)}
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
    {
      key: 'created_at',
      title: 'Created',
      render: (value) => <span className="text-sm text-gray-600">{formatDate(value)}</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewImage(row)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
            title="View Image"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRedoOCR(row.id)}
            disabled={redoingOCR === row.id}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50"
            title="Redo OCR"
          >
            {redoingOCR === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => handleDeleteImage(row.id)}
            disabled={deletingImage === row.id}
            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete Image"
          >
            {deletingImage === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(`/uploads/group/${groupId}`)} 
              className="mr-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Batch: 
                </h1>
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      className="px-3 py-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter batch name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName || !newBatchName.trim()}
                      className="flex items-center px-2 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 transition-colors"
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingName}
                      className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {batchInfo?.batchName || 'Loading...'}
                    </span>
                    <button
                      onClick={handleEditName}
                      className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Edit batch name"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {batchInfo?.imageCount || 0} images • {batchInfo?.uploadCount || 0} uploads
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchBatchDetails(false)}
              disabled={refreshing}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleGoToMark}
              className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Go to Mark
            </button>
            
            <button
              onClick={handleDeleteBatch}
              className="flex items-center px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Batch
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Images Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Images in Batch</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on an image to view and edit OCR text
            </p>
          </div>
          
          <CardTable
            data={images}
            columns={imageColumns}
            loading={refreshing}
            searchable={true}
            selectable={true}
            onSelectionChange={(selected) => {
              // Handle image selection
              console.log('Selected images:', selected);
            }}
            searchPlaceholder="Search images..."
            searchFields={['id', 'ocr_text']}
            bulkActions={[
              {
                label: 'Delete Selected',
                variant: 'danger',
                icon: Trash2,
                onClick: (selected) => {
                  // Handle bulk delete images
                  console.log('Delete selected images:', selected);
                }
              }
            ]}
            emptyMessage="No images found in this batch"
            className="min-h-[400px]"
          />
        </div>

      </div>
    </div>
  );
};

export default BatchDetailsPage;
