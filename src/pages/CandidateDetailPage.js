import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Save, Download, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import api from '../api/axios';

export default function CandidateDetailPage() {
  const { uploadId, candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [upload, setUpload] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [markingScheme, setMarkingScheme] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchCandidateDetails();
  }, [uploadId, candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch upload details
      const uploadResponse = await api.get(`/uploads/${uploadId}`);
      setUpload(uploadResponse.data);

      // Fetch candidate details
      const candidateResponse = await api.get(`/uploads/${uploadId}/candidates/${candidateId}`);
      setCandidate(candidateResponse.data);

      // Fetch marking scheme
      if (uploadResponse.data.marking_scheme_id) {
        const schemeResponse = await api.get(`/marking-schemes/${uploadResponse.data.marking_scheme_id}`);
        setMarkingScheme(schemeResponse.data);
      }

      // Fetch marks
      try {
        const marksResponse = await api.get(`/uploads/${uploadId}/candidates/${candidateId}/marks`);
        setMarks(marksResponse.data.marks || {});
      } catch (err) {
        // No marks yet
        setMarks({});
      }

      setError(null);
    } catch (err) {
      setError('Failed to load candidate details');
      console.error('Fetch candidate details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      await api.post(`/uploads/${uploadId}/candidates/${candidateId}/marks`, {
        marks
      });
      setSuccess('Marks updated successfully');
      setEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to save marks');
      console.error('Save marks error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkChange = (questionId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: field === 'score' ? parseFloat(value) || 0 : value,
        marked_at: new Date().toISOString(),
        marked_by: user.id
      }
    }));
  };

  const handleDownloadScript = async () => {
    try {
      const response = await api.get(`/uploads/${uploadId}/candidates/${candidateId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${candidate?.candidate_id}_script.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download script. Please try again.');
    }
  };

  const getTotalScore = () => {
    return Object.values(marks).reduce((total, mark) => total + (mark.score || 0), 0);
  };

  const getTotalPossible = () => {
    return markingScheme?.questions?.reduce((total, q) => total + (q.max_marks || 0), 0) || 0;
  };

  const getPercentage = () => {
    const total = getTotalPossible();
    const score = getTotalScore();
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const getGrade = () => {
    const percentage = getPercentage();
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = () => {
    const grade = getGrade();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={saving} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/uploads/${uploadId}/results`)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Candidate Details
                </h1>
                <p className="mt-2 text-gray-600">
                  View and edit candidate performance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Edit className="-ml-1 mr-2 h-5 w-5" />
                    Edit Marks
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="-ml-1 mr-2 h-5 w-5" />
                    Download Script
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMarks}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Candidate Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Info</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">ID:</span> {candidate?.candidate_id}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Name:</span> {candidate?.candidate_name || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Pages:</span> {candidate?.pages_detected || 0}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Info</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">File:</span> {upload?.filename}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Group:</span> {upload?.group_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Uploaded:</span> {upload?.created_at ? formatDate(upload.created_at) : 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Score Summary</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Score:</span> {getTotalScore()} / {getTotalPossible()}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Percentage:</span> {getPercentage()}%
                </p>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 text-sm mr-2">Grade:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor()}`}>
                    {getGrade()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Validation</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  {candidate?.validation_status === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                  )}
                  <span className="text-sm text-gray-700">
                    {candidate?.validation_status || 'Unknown'}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Confidence:</span> {candidate?.confidence_score || 0}%
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Issues:</span> {candidate?.issues_count || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}
        
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
            className="mb-6"
          />
        )}

        {/* Question-wise Marks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Question-wise Performance</h2>
            
            {markingScheme?.questions?.length > 0 ? (
              <div className="space-y-6">
                {markingScheme.questions.map((question, index) => {
                  const questionMark = marks[question.id] || {};
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            Question {index + 1}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {question.text || 'No question text available'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Max marks: {question.max_marks}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {questionMark.score || 0} / {question.max_marks}
                          </p>
                          <p className="text-sm text-gray-500">
                            {question.max_marks > 0 
                              ? Math.round(((questionMark.score || 0) / question.max_marks) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>

                      {editMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={question.max_marks}
                              step="0.5"
                              value={questionMark.score || ''}
                              onChange={(e) => handleMarkChange(question.id, 'score', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Comments
                            </label>
                            <textarea
                              rows={3}
                              value={questionMark.comment || ''}
                              onChange={(e) => handleMarkChange(question.id, 'comment', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Add feedback..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Student Answer */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Student Answer</h4>
                            <div className="bg-gray-50 p-3 rounded border">
                              <p className="text-sm text-gray-700">
                                {candidate?.answers?.[question.id] || 'Answer not extracted or not available'}
                              </p>
                            </div>
                          </div>

                          {/* Comments */}
                          {questionMark.comment && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Marker Comments</h4>
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-sm text-blue-800">{questionMark.comment}</p>
                              </div>
                            </div>
                          )}

                          {/* Marking Info */}
                          {questionMark.marked_at && (
                            <div className="text-xs text-gray-500">
                              Marked on {formatDate(questionMark.marked_at)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No marking scheme available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
