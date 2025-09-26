import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, RefreshCcw, Save, Download } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';

export default function PageDetailPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [saving, setSaving] = useState(false);
  const [redoingOCR, setRedoingOCR] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  async function fetchPage() {
    try {
      setLoading(true);
      const response = await api.get(`/pages/${pageId}`);
      const body = response.data;
      const pageData = body.data || body;
      setPage(pageData);
      setOcrText(pageData.ocr_text || '');
      setError(null);
    } catch (e) {
      console.error('Failed to fetch page detail', e);
      const errorMsg = 'Failed to load page details.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function saveOCR() {
    if (!page) return;
    try {
      setSaving(true);
      toast.info('Saving OCR text...');
      await api.patch(`/pages/${page.id}/ocr`, { ocr_text: ocrText });
      toast.success('OCR text saved successfully');
      await fetchPage();
    } catch (e) {
      console.error('Save OCR failed', e);
      const errorMsg = 'Failed to save OCR text.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function redoOCR() {
    if (!page) return;
    try {
      setRedoingOCR(true);
      toast.info('Initiating OCR redo...');
      await api.post(`/pages/${page.id}/ocr/redo`);
      toast.success('OCR redo initiated successfully. Processing will begin shortly.');
      await fetchPage();
    } catch (e) {
      console.error('Redo OCR failed', e);
      const errorMsg = 'Failed to redo OCR.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setRedoingOCR(false);
    }
  }

  function getImageUrl(blobUrl) {
    if (!blobUrl) return '';
    if (/^https?:\/\//i.test(blobUrl)) {
      return blobUrl;
    }
    return blobUrl.startsWith('/') ? blobUrl : '/' + blobUrl;
  }

  function getOriginalFilename() {
    if (page?.metadata_jsonb?.original_filename) {
      return page.metadata_jsonb.original_filename;
    }
    return `Image ${pageId.substring(0, 8)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && !page} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-3 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Page Detail</h1>
            <p className="text-gray-600">View image and OCR text, edit text or redo OCR.</p>
            {page && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-500">File: {getOriginalFilename()}</span>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={page.status || 'pending'} type="page" />
                  <StatusBadge status={page.ocr_status || 'pending'} type="ocr" />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Main content - Image on left, OCR text on right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Section - Left side */}
          <div className="flex-1 lg:max-w-[50%]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Document Image</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Page {page?.page_no || 'Unknown'}</span>
                  {page?.blob_url && (
                    <a
                      href={getImageUrl(page.blob_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-300 rounded-md hover:bg-indigo-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  )}
                </div>
              </div>
              
              {/* Image display */}
              {page ? (
                <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={getImageUrl(page.blob_url)} 
                    alt={`Page ${page.page_no || 'Unknown'}`} 
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-2" />
                      <p>Image not available</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-2" />
                    <p>Loading image...</p>
                  </div>
                </div>
              )}

              {/* Page metadata */}
              {page && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Page Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Page ID:</span>
                      <span className="ml-2 font-mono text-xs">{page.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Page Number:</span>
                      <span className="ml-2">{page.page_no || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">OCR Confidence:</span>
                      <span className="ml-2">
                        {page.ocr_confidence ? `${(page.ocr_confidence * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">File Size:</span>
                      <span className="ml-2">
                        {page.metadata_jsonb?.file_size ? 
                          `${(page.metadata_jsonb.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OCR Text Section - Right side */}
          <div className="flex-1 lg:max-w-[50%]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold text-gray-700">OCR Text Editor</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={redoOCR} 
                    disabled={!page || redoingOCR || saving} 
                    className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {redoingOCR ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Redo OCR
                      </>
                    )}
                  </button>
                  <button 
                    onClick={saveOCR} 
                    disabled={!page || saving || redoingOCR} 
                    className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {page ? (
                <div className="flex-1 flex flex-col">
                  <div className="mb-2 text-sm text-gray-600">
                    Editing text for page {page.page_no || 'Unknown'}
                  </div>
                  <textarea 
                    value={ocrText} 
                    onChange={e => setOcrText(e.target.value)} 
                    className="flex-1 min-h-[300px] lg:min-h-[400px] border border-gray-300 rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                    placeholder="OCR text will appear here. You can edit this text and save your changes..."
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {ocrText.length} characters
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-2" />
                    <p>Loading page data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
