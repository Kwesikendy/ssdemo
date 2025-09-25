import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, RefreshCw, Loader2, Trash2, Save } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastProvider';
import { useImageOperations } from '../hooks/useImageOperations';

export default function BatchImageDetailsPage() {
  const { groupId, batchName, pageId } = useParams();
  const navigate = useNavigate();
  const { success, error: showError, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [savingOCR, setSavingOCR] = useState(false);
  const [redoingOCR, setRedoingOCR] = useState(false);

  const fetchPageDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const response = await api.get(`/scripts/${pageId}`);
      const pageData = response.data.data;

      setPage(pageData);
      setOcrText(pageData.ocr_text || '');
    } catch (err) {
      console.error('Failed to fetch page details:', err);
      const errorMsg = 'Failed to load image details';
      setError(errorMsg);
      if (!showLoader) {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [pageId, showError]);

  const { deletingImage, handleDeleteImage, handleUpdateOCR } = useImageOperations(fetchPageDetails);

  useEffect(() => {
    fetchPageDetails();
  }, [fetchPageDetails]);

  const handleOCRTextChange = (e) => {
    setOcrText(e.target.value);
  };

  const handleSaveOCR = async () => {
    if (!page) return;

    try {
      setSavingOCR(true);
      await handleUpdateOCR(page.id, ocrText);
    } catch (err) {
      console.error('Failed to save OCR text:', err);
      showError('Failed to save OCR text');
    } finally {
      setSavingOCR(false);
    }
  };

  const handleRedoOCR = async () => {
    if (!page) return;

    try {
      setRedoingOCR(true);
      info('Queuing OCR job...');
      
      await api.post(`/exams/${groupId}/scripts/${page.id}/redo-ocr`);
      success('OCR job queued successfully. Processing will begin shortly.');
      
      // Refresh the data to show updated status
      await fetchPageDetails(false);
      
      // Set up polling to check for OCR completion
      const pollInterval = setInterval(async () => {
        try {
          await fetchPageDetails(false);
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000); // Poll every 2 seconds
      
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);
    } catch (err) {
      console.error('Failed to queue OCR job:', err);
      showError('Failed to queue OCR job');
    } finally {
      setRedoingOCR(false);
    }
  };

  const handleDeletePage = async () => {
    if (!page) return;

    try {
      await handleDeleteImage(page.id);
      // Navigate back to batch details after successful deletion
      navigate(`/uploads/group/${groupId}/batch/${encodeURIComponent(batchName)}`);
    } catch (err) {
      console.error('Failed to delete page:', err);
      showError('Failed to delete image');
    }
  };

  const handleBack = () => {
    navigate(`/uploads/group/${groupId}/batch/${encodeURIComponent(batchName)}`);
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Batch
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Image {page?.id.slice(0, 8)}...
                </h1>
                <p className="text-sm text-gray-500">
                  Batch: {batchName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRedoOCR}
                disabled={redoingOCR}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                title="Redo OCR"
              >
                {redoingOCR ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Redo OCR
              </button>
              <button
                onClick={handleDeletePage}
                disabled={deletingImage === page?.id}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                title="Delete Image"
              >
                {deletingImage === page?.id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Display */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Image Preview</h2>
            </div>
            <div className="p-6">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden border">
                <img
                  src={page?.blob_url}
                  alt={`${page?.id.slice(0, 8)}`}
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
            </div>
          </div>

          {/* OCR Text Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">OCR Text Editor</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Status: <StatusBadge status={page?.ocr_status} type="ocr" />
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OCR Text
                  </label>
                  <textarea
                    value={ocrText}
                    onChange={handleOCRTextChange}
                    rows={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="OCR text will appear here..."
                  />
                </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
