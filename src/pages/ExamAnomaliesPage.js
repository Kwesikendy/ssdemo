import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft,
  Clock,
  FileText,
  Play,
  Edit3,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

const ExamAnomaliesPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [editingAnomaly, setEditingAnomaly] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (examId) {
      fetchAnomalies();
    }
  }, [examId]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/anomalies/exam/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch anomalies');
      }

      const data = await response.json();
      setAnomalies(data.data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryOCR = async (anomalyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [anomalyId]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${anomalyId}/retry-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retry OCR');
      }

      toast.success('OCR retry job queued successfully');
      // Refresh the anomalies list after a short delay
      setTimeout(() => {
        fetchAnomalies();
      }, 2000);
    } catch (err) {
      toast.error('Failed to retry OCR');
    } finally {
      setActionLoading(prev => ({ ...prev, [anomalyId]: false }));
    }
  };

  const handleResolveAnomaly = async (anomalyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [anomalyId]: true }));
      
      const response = await fetch(`/api/v1/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution_notes: resolutionNotes || 'Resolved by user'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve anomaly');
      }

      toast.success('Anomaly resolved successfully');
      setEditingAnomaly(null);
      setResolutionNotes('');
      fetchAnomalies();
    } catch (err) {
      toast.error('Failed to resolve anomaly');
    } finally {
      setActionLoading(prev => ({ ...prev, [anomalyId]: false }));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'open': return 'text-yellow-600 bg-yellow-100';
      case 'ignored': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAnomalyTypeIcon = (type) => {
    switch (type) {
      case 'missing_id_or_index': return <FileText className="h-4 w-4" />;
      case 'low_ocr_confidence': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading anomalies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Anomalies</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnomalies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
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
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/anomalies')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Anomalies</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Anomalies</h1>
              <p className="mt-2 text-gray-600">
                {anomalies.length} {anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected
              </p>
            </div>
            <button
              onClick={fetchAnomalies}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Anomalies List */}
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getAnomalyTypeIcon(anomaly.anomaly_type)}
                      <SeverityBadge severity={anomaly.severity} size="sm" />
                      <StatusBadge status={anomaly.status} size="sm" />
                      <span className="text-sm text-gray-500">
                        {anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{anomaly.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Created {new Date(anomaly.created_at).toLocaleDateString()}</span>
                      </div>
                      {anomaly.page_number && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Page {anomaly.page_number}</span>
                        </div>
                      )}
                    </div>
                    {anomaly.resolution_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Resolution Notes:</strong> {anomaly.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {anomaly.status !== 'resolved' && (
                      <>
                        <button
                          onClick={() => handleRetryOCR(anomaly.id)}
                          disabled={actionLoading[anomaly.id]}
                          className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        >
                          {actionLoading[anomaly.id] ? (
                            <LoadingSpinner size="sm" text="" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span>Retry OCR</span>
                        </button>
                        <button
                          onClick={() => setEditingAnomaly(anomaly.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {anomalies.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Anomalies Found</h2>
            <p className="text-gray-600">This exam has no anomalies detected.</p>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {editingAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resolve Anomaly</h3>
              <button
                onClick={() => {
                  setEditingAnomaly(null);
                  setResolutionNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe how this anomaly was resolved..."
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingAnomaly(null);
                  setResolutionNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveAnomaly(editingAnomaly)}
                disabled={actionLoading[editingAnomaly]}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading[editingAnomaly] ? (
                  <LoadingSpinner size="sm" text="Resolving..." />
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAnomaliesPage;
