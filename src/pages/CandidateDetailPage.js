import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Eye, CheckCircle, AlertCircle, FileText, Image, Star, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import api from '../api/axios';

export default function CandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch candidate result details using the correct API endpoint
      const response = await api.get(`/results/candidates/${candidateId}`);
      setCandidateDetail(response.data);

      setError(null);
    } catch (err) {
      setError('Failed to load candidate details');
      console.error('Fetch candidate details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPage = (page) => {
    setSelectedPage(page);
    setShowImageModal(true);
  };

  const handleViewPageByNumber = (pageNumber) => {
    // Find the page with the matching page number
    const page = candidateDetail.pages?.find(p => p.page_no === pageNumber);
    if (page) {
      handleViewPage(page);
    }
  };

  const handleDownloadScript = async () => {
    try {
      // Download all pages as a PDF or ZIP
      const response = await api.get(`/results/candidates/${candidateId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${candidateDetail?.index_number}_script.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download script. Please try again.');
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100'
    };
    return colors[grade] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (!candidateDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidate Not Found</h2>
          <p className="text-gray-600 mb-4">The requested candidate could not be found.</p>
          <button
            onClick={() => navigate('/results')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const percentage = candidateDetail.percentage || 0;
  const grade = getGrade(percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/results')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Candidate {candidateDetail.index_number}
                </h1>
                <p className="mt-2 text-gray-600">
                  Detailed results and script pages
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownloadScript}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="-ml-1 mr-2 h-5 w-5" />
                Download Script
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Index Number</h3>
                  <p className="text-2xl font-bold text-gray-900">{candidateDetail.index_number}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Score</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {candidateDetail.total_awarded || 0} / {candidateDetail.total_max || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Percentage</h3>
                  <p className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Grade</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getGradeColor(grade)}`}>
                    {grade}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Question Results
              </h2>
              
              {candidateDetail.sub_results && candidateDetail.sub_results.length > 0 ? (
                <div className="space-y-4">
                  {candidateDetail.sub_results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            Question {result.question_number}
                          </h3>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              Score: <span className="font-semibold">{result.awarded}</span> / {result.max_marks}
                            </span>
                            <span className="text-sm text-gray-600">
                              Percentage: <span className="font-semibold">
                                {result.max_marks > 0 ? Math.round((result.awarded / result.max_marks) * 100) : 0}%
                              </span>
                            </span>
                            {result.page_number && (
                              <button
                                onClick={() => handleViewPageByNumber(result.page_number)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                title="View answer on page"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Page {result.page_number}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            result.awarded >= result.max_marks * 0.8 
                              ? 'text-green-800 bg-green-100' 
                              : result.awarded >= result.max_marks * 0.6
                              ? 'text-yellow-800 bg-yellow-100'
                              : 'text-red-800 bg-red-100'
                          }`}>
                            {result.awarded >= result.max_marks * 0.8 ? 'Excellent' : 
                             result.awarded >= result.max_marks * 0.6 ? 'Good' : 'Needs Improvement'}
                          </div>
                        </div>
                      </div>
                      
                      {result.feedback && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">{result.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No question results available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Script Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Image className="h-6 w-6 mr-2" />
                Script Pages
              </h2>
              
              {candidateDetail.pages && candidateDetail.pages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {candidateDetail.pages.map((page, index) => (
                    <div
                      key={page.page_id}
                      className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      onClick={() => handleViewPage(page)}
                    >
                      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">
                          Page {page.page_no || index + 1}
                        </p>
                        <p className="text-xs text-gray-500">Click to view</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No script pages available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Notes Section */}
        {candidateDetail.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Additional Notes
              </h2>
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-gray-700">{candidateDetail.notes}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Page {selectedPage.page_no || 'Unknown'}
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedPage.blob_url}
                alt={`Page ${selectedPage.page_no || 'Unknown'}`}
                className="max-w-full max-h-96 mx-auto rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center h-96 bg-gray-100 rounded">
                <div className="text-center">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Image could not be loaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
