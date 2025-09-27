import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, RefreshCw, Save, Edit3, GripVertical } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function CandidatePagesView() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [candidate, setCandidate] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [pageOrder, setPageOrder] = useState([]);

  useEffect(() => {
    fetchCandidateData();
  }, [candidateId]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/candidates/${candidateId}/pages`);
      const body = res.data;
      console.log('API Response:', body);
      console.log('Pages data:', body.data.pages);
      setCandidate(body.data.candidate);
      setPages(body.data.pages || []);
      setPageOrder(body.data.pages || []);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch candidate data', e);
      const errorMsg = 'Failed to load candidate pages.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCandidateData();
    setRefreshing(false);
  };

  const handlePageReorder = (dragIndex, hoverIndex) => {
    const newOrder = [...pageOrder];
    const draggedItem = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    setPageOrder(newOrder);
  };

  const handleSaveOrder = async () => {
    try {
      const updates = pageOrder.map((page, index) => ({
        page_id: page.id,
        page_number: index + 1
      }));

      await api.patch(`/candidates/${candidateId}/pages/reorder`, {
        page_order: updates
      });

      toast.success('Page order updated successfully');
      setIsEditingOrder(false);
      await fetchCandidateData();
    } catch (e) {
      console.error('Failed to update page order', e);
      toast.error('Failed to update page order');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Alert type="error" message={error} />
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Candidate: {candidate?.index_number || 'Unknown'}
            </h1>
            <p className="text-gray-600">
              {pages.length} page{pages.length !== 1 ? 's' : ''} • 
              ID: {candidateId?.slice(0, 8)}...
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setIsEditingOrder(!isEditingOrder)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditingOrder ? 'Cancel Edit' : 'Edit Order'}
            </button>
            {isEditingOrder && (
              <button
                onClick={handleSaveOrder}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Order
              </button>
            )}
          </div>
        </div>

        {/* Pages Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Pages</h2>
            <p className="text-sm text-gray-500">
              Click on a page to view it in detail
            </p>
          </div>

          {pages.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No pages found for this candidate</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pageOrder.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative group cursor-pointer ${
                    isEditingOrder ? 'cursor-move' : 'hover:shadow-md'
                  }`}
                  onClick={() => !isEditingOrder && setSelectedPage(page)}
                >
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-indigo-300">
                    {/* Page Image */}
                    <div className="aspect-[3/4] bg-white relative">
                      <img
                        src={page.blob_url || ''}
                        alt={`Page ${page.page_no || index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-500">
                          <Eye className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    </div>

                    {/* Page Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Page {page.page_no || index + 1}
                        </span>
                        {isEditingOrder && (
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge 
                          status={page.status || 'pending'} 
                          type="ocr" 
                          className="text-xs"
                        />
                        <span className="text-xs text-gray-500">
                          {formatDate(page.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    {!isEditingOrder && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Page Modal */}
        {selectedPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Page {selectedPage.page_no || 'Unknown'}
                </h3>
                <button
                  onClick={() => setSelectedPage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Image</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={selectedPage.blob_url || ''}
                        alt={`Page ${selectedPage.page_no || 'Unknown'}`}
                        className="w-full h-auto max-h-[60vh] object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden h-64 items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-500">
                          <Eye className="h-12 w-12 mx-auto mb-2" />
                          <p>Image not available</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OCR Text */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">OCR Text</h4>
                    <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                        {selectedPage.ocr_text || 'No OCR text available'}
                      </pre>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {selectedPage.ocr_confidence ? (selectedPage.ocr_confidence * 100).toFixed(1) + '%' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
