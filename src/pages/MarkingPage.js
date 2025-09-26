import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckSquare, Save, SkipForward, AlertCircle, FileText, User, Zap, RefreshCw, Bot, Clock, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingProgressBar from '../components/LoadingProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function MarkingPage() {
  const { uploadId, candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [upload, setUpload] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [markingScheme, setMarkingScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Group marking state
  const [aiMarking, setAiMarking] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('');
  const [markingJob, setMarkingJob] = useState(null);
  
  // Background process state
  const [backgroundProcesses, setBackgroundProcesses] = useState([]);
  const pollingInterval = useRef(null);

  useEffect(() => {
    fetchMarkingData();
  }, [uploadId, candidateId]);

  // Start polling for background processes when marking job is active
  useEffect(() => {
    if (markingJob) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [markingJob]);

  const startPolling = () => {
    pollingInterval.current = setInterval(async () => {
      await checkMarkingProgress();
    }, 2000); // Poll every 2 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const checkMarkingProgress = async () => {
    if (!markingJob) return;
    
    try {
      const response = await api.get(`/marking-jobs/${markingJob.id}/status`);
      const job = response.data;
      
      setAiProgress(job.progress || 0);
      setAiStatus(job.status_message || '');
      
      if (job.status === 'completed') {
        setAiResults(job.results || {});
        setMarkingJob(null);
        setAiMarking(false);
        addToast('success', 'AI Marking Complete', 'All scripts have been automatically marked by AI');
        // Refresh marks to get AI results
        await fetchMarkingData();
      } else if (job.status === 'failed') {
        setMarkingJob(null);
        setAiMarking(false);
        addToast('error', 'AI Marking Failed', job.error_message || 'Please try again or mark manually');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const fetchMarkingData = async () => {
    try {
      setLoading(true);
      
      // Fetch upload details
      const uploadResponse = await api.get(`/uploads/${uploadId}`);
      setUpload(uploadResponse.data);

      // Fetch candidate details
      const candidateResponse = await api.get(`/uploads/${uploadId}/candidates/${candidateId}`);
      setCandidate(candidateResponse.data);

      // Fetch marking scheme
      const schemeResponse = await api.get(`/marking-schemes/${uploadResponse.data.marking_scheme_id}`);
      setMarkingScheme(schemeResponse.data);

      setError(null);
    } catch (err) {
      setError('Failed to load marking data');
      console.error('Fetch marking data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGroupMarking = async () => {
    try {
      setAiMarking(true);
      setAiProgress(0);
      setAiStatus('Starting group marking...');
      
      addToast('info', 'Group Marking Started', 'All pages in this group are being marked automatically');
      
      const response = await api.post(`/groups/${upload.group_id}/marking-jobs/start`, {
        include_custom_instructions: true
      });
      
      setMarkingJob(response.data.job);
      setAiStatus('AI is analyzing all pages in the group...');
    } catch (err) {
      setAiMarking(false);
      addToast('error', 'Group Marking Failed', err.response?.data?.message || 'Please try again');
      console.error('Group marking error:', err);
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/uploads/${uploadId}`)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Group Marking
                </h1>
                <p className="mt-2 text-gray-600">
                  AI-powered marking for all pages in this group
                </p>
              </div>
            </div>
          </motion.div>

          {/* Group Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Group</h3>
                  <p className="text-sm text-gray-500">{upload?.group_name}</p>
                  <p className="text-sm text-gray-500">All pages will be marked</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Marking Scheme</h3>
                  <p className="text-sm text-gray-500">{markingScheme?.name}</p>
                  <p className="text-sm text-gray-500">AI-powered marking</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Marking Progress */}
        <AnimatePresence>
          {aiMarking && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Bot className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">AI Group Marking in Progress</h3>
                    <p className="text-sm text-blue-700">{aiStatus}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="text-sm font-medium text-blue-900">{Math.round(aiProgress)}%</span>
                </div>
              </div>
              <LoadingProgressBar progress={aiProgress} className="mb-2" />
              <p className="text-xs text-blue-600">All pages in this group are being marked automatically</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Marking Button */}
        <div className="flex justify-center">
          <button
            onClick={handleStartGroupMarking}
            disabled={aiMarking}
            className="inline-flex items-center px-8 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiMarking ? (
              <>
                <LoadingSpinner size="sm" className="-ml-1 mr-2" />
                AI Marking Group...
              </>
            ) : (
              <>
                <Zap className="-ml-1 mr-2 h-6 w-6" />
                Start AI Group Marking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
