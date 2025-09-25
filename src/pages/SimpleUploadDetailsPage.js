import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, RefreshCw, Save, Trash2, Loader2 } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import { useImageOperations } from '../hooks/useImageOperations';

const SimpleUploadDetailsPage = () => {
  const { groupId, uploadId } = useParams();
  const navigate = useNavigate();
  const { success, error: showError, info } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [upload, setUpload] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [savingOCR, setSavingOCR] = useState(false);
  const [redoingOCR, setRedoingOCR] = useState(null);

  // Fetch upload details
  const fetchUploadDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch upload details
      const uploadRes = await api.get(`/batch-uploads/${uploadId}`);
      const uploadData = uploadRes.data.data || uploadRes.data;
      setUpload(uploadData);

      // Fetch pages for this upload
      const pagesRes = await api.get(`/batch-uploads/${uploadId}/scripts`, { 
        params: { page: 1, per_page: 100 } 
      });
      const pagesData = pagesRes.data.data?.pages || pagesRes.data.pages || [];

      // Select first page if available
      if (pagesData.length > 0) {
        setSelectedPage(pagesData[0]);
        setOcrText(pagesData[0].ocr_text || '');
      }

    } catch (err) {
      console.error('Failed to fetch upload details', err);
      const errorMsg = 'Failed to load upload details.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uploadId, showError]);

  // Use image operations hook
  const { deletingImage, handleDeleteImage, handleUpdateOCR } = useImageOperations(fetchUploadDetails);

  useEffect(() => {
    fetchUploadDetails();
  }, [fetchUploadDetails]);

  // Handle OCR text update
  const handleOCRTextChange = (e) => {
    setOcrText(e.target.value);
  };

  // Handle save OCR text
  const handleSaveOCR = async () => {
    if (!selectedPage) return;
    
    try {
      setSavingOCR(true);
      await handleUpdateOCR(selectedPage.id, ocrText);
    } catch (err) {
      console.error('Failed to save OCR text', err);
    } finally {
      setSavingOCR(false);
    }
  };

  // Handle redo OCR
  const handleRedoOCR = async (pageId) => {
    try {
      setRedoingOCR(pageId);
      info('Queuing OCR job...');
      
      await api.post(`/exams/${groupId}/scripts/${pageId}/redo-ocr`);
      success('OCR job queued successfully. Processing will begin shortly.');
      
      // Refresh the data to show updated status
      await fetchUploadDetails(false);
      
      // Set up polling to check for OCR completion
      const pollInterval = setInterval(async () => {
        try {
          await fetchUploadDetails(false);
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

  // Handle delete page
  const handleDeletePage = async (pageId) => {
    try {
      await handleDeleteImage(pageId);
    } catch (err) {
      console.error('Failed to delete page', err);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(`/uploads/group/${groupId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert type="error" message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Group
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Upload Details
                </h1>
                <p className="text-sm text-gray-600">
                  Upload ID: {uploadId}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchUploadDetails(false)}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Upload Info */}
        {upload && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Upload Status</h3>
                <div className="mt-1">
                  <StatusBadge status={upload.upload_status || upload.status} type="upload" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(upload.created_at)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Display */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedPage ? `Image ${selectedPage.id.slice(0, 8)}...` : 'Select an Image'}
              </h2>
            </div>
            <div className="p-6">
              {selectedPage ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden border">
                  <img
                    src={selectedPage.blob_url}
                          alt={`${selectedPage.id.slice(0, 8)}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Image not available</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select an image to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* OCR Text Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">OCR Text Editor</h2>
                {selectedPage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRedoOCR(selectedPage.id)}
                      disabled={redoingOCR === selectedPage.id}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      title="Redo OCR"
                    >
                      {redoingOCR === selectedPage.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Redo OCR
                    </button>
                    <button
                      onClick={() => handleDeletePage(selectedPage.id)}
                      disabled={deletingImage === selectedPage.id}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      title="Delete Image"
                    >
                      {deletingImage === selectedPage.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {selectedPage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      OCR Text
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Status: <StatusBadge status={selectedPage.ocr_status} type="ocr" />
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={ocrText}
                    onChange={handleOCRTextChange}
                    rows={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="OCR text will appear here..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveOCR}
                      disabled={savingOCR}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {savingOCR ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {savingOCR ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p>Select an image to edit OCR text</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimpleUploadDetailsPage;
