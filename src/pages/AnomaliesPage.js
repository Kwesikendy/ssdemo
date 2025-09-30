import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Eye, 
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

const AnomaliesPage = () => {
  const navigate = useNavigate();
  const [anomalyGroups, setAnomalyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnomalyGroups();
  }, []);

  const fetchAnomalyGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/anomalies/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch anomaly groups');
      }

      const data = await response.json();
      setAnomalyGroups(data.data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
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
            onClick={fetchAnomalyGroups}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (anomalyGroups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Anomalies Found</h2>
          <p className="text-gray-600">All exams are processing correctly with no issues detected.</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Anomalies</h1>
              <p className="mt-2 text-gray-600">
                Review and resolve issues detected during OCR processing
              </p>
            </div>
            <button
              onClick={fetchAnomalyGroups}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Anomaly Groups */}
        <div className="space-y-6">
          {anomalyGroups.map((group) => (
            <div key={group.exam_id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Group Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.exam_name}</h3>
                      <p className="text-sm text-gray-600">
                        {group.anomaly_count} {group.anomaly_count === 1 ? 'anomaly' : 'anomalies'} detected
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/anomalies/exam/${group.exam_id}`)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {/* Anomalies Preview */}
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {group.anomalies.slice(0, 3).map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <SeverityBadge severity={anomaly.severity} size="sm" />
                        <StatusBadge status={anomaly.status} size="sm" />
                        <span className="text-sm text-gray-700">{anomaly.description}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(anomaly.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {group.anomalies.length > 3 && (
                    <div className="text-center">
                      <button
                        onClick={() => navigate(`/anomalies/exam/${group.exam_id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View {group.anomalies.length - 3} more anomalies...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnomaliesPage;