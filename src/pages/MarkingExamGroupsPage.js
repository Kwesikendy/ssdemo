import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Circle, Loader2, Upload, AlertTriangle, RefreshCw, ChevronLeft, Users, FileText } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import CardTable from '../components/CardTable';
import api from '../api/axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

// Color coding for different group types and statuses
const getGroupTypeColor = (groupType) => {
  switch (groupType) {
    case 'simple':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'batch':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getMarkingStatusColor = (status) => {
  switch (status) {
    case 'not_started':
      return 'bg-gray-100 text-gray-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'success':
      return 'bg-green-100 text-green-700';
    case 'success_with_anomalies':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getMarkingStatusIcon = (status) => {
  switch (status) {
    case 'not_started':
      return <Circle className="w-4 h-4 mr-1" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
    case 'success':
      return <CheckCircle className="w-4 h-4 mr-1" />;
    case 'success_with_anomalies':
      return <AlertTriangle className="w-4 h-4 mr-1" />;
    default:
      return <Circle className="w-4 h-4 mr-1" />;
  }
};

export default function MarkingExamGroupsPage() {
  const { success, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { examId } = useParams();
  
  const [exam, setExam] = useState(null);
  const [groups, setGroups] = useState([]);
  const [batches, setBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState({});
  const [selectedBatches, setSelectedBatches] = useState({});
  const [markingInProgress, setMarkingInProgress] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Fetch exam details
  const fetchExamDetails = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${examId}`);
      setExam(response.data);
    } catch (err) {
      console.error('Failed to fetch exam details:', err);
      setError('Failed to load exam details. Please try again.');
    }
  }, [examId]);

  // Fetch groups for this exam
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/exams/${examId}/groups`);
      const groupsData = response.data.groups || [];
      
      setGroups(groupsData);
      
      // Initialize selected groups state
      const initialSelected = {};
      groupsData.forEach(group => {
        initialSelected[group.id] = false;
      });
      setSelectedGroups(initialSelected);
      
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Fetch batches for a specific group
  const fetchBatches = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/batches`);
      const batchesData = response.data.batches || [];
      
      setBatches(prev => ({
        ...prev,
        [groupId]: batchesData
      }));
      
      // Initialize selected batches state
      const initialSelected = {};
      batchesData.forEach(batch => {
        initialSelected[batch.batchName] = false;
      });
      setSelectedBatches(prev => ({
        ...prev,
        [groupId]: initialSelected
      }));
      
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  useEffect(() => {
    fetchExamDetails();
    fetchGroups();
  }, [fetchExamDetails, fetchGroups]);

  // Check marking progress and show completion toasts
  const checkMarkingProgress = async () => {
    try {
      const response = await api.get('/marking-groups/enhanced/progress');
      
      if (!response.data || !response.data.groups || !Array.isArray(response.data.groups)) {
        console.warn('Invalid progress response structure:', response.data);
        return;
      }
      
      const groups = response.data.groups;
      
      // Check for completed markings
      groups.forEach(groupProgress => {
        const groupId = groupProgress.group_id;
        if (groupProgress.marking_status === 'success' && markingInProgress[groupId]) {
          success(`Marking completed successfully for group: ${groupProgress.group_name}`);
          setMarkingInProgress(prev => ({
            ...prev,
            [groupId]: false
          }));
        } else if (groupProgress.marking_status === 'failed' && markingInProgress[groupId]) {
          showError(`Marking failed for group: ${groupProgress.group_name}`);
          setMarkingInProgress(prev => ({
            ...prev,
            [groupId]: false
          }));
        } else if (groupProgress.marking_status === 'not_started' && markingInProgress[groupId]) {
          showError(
            `Marking could not start for group: ${groupProgress.group_name}.`,
            8000,
            {
              label: 'Configure Marking Schemes',
              onClick: () => navigate('/schemes')
            }
          );
          setMarkingInProgress(prev => ({
            ...prev,
            [groupId]: false
          }));
        }
      });
    } catch (err) {
      console.error('Failed to check marking progress:', err);
    }
  };

  // Auto-refresh when marking is in progress
  useEffect(() => {
    let interval;
    if (autoRefresh || Object.values(markingInProgress).some(status => status)) {
      interval = setInterval(async () => {
        await fetchGroups();
        await checkMarkingProgress();
        // Refresh batches for expanded groups
        Object.keys(expandedGroups).forEach(groupId => {
          if (expandedGroups[groupId]) {
            fetchBatches(groupId);
          }
        });
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, markingInProgress, expandedGroups, fetchGroups]);

  // Toggle group expansion
  const toggleGroupExpansion = async (groupId) => {
    const isExpanded = expandedGroups[groupId];
    
    if (!isExpanded) {
      // Fetch batches when expanding
      await fetchBatches(groupId);
    }
    
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !isExpanded
    }));
  };

  // Start marking for groups
  const startGroupMarking = async (groupIds) => {
    if (!groupIds || groupIds.length === 0) return;
    
    try {
      setError(null);
      info(`Starting marking for ${groupIds.length} group(s)...`);
      
      // Update marking progress state
      groupIds.forEach(groupId => {
        setMarkingInProgress(prev => ({
          ...prev,
          [groupId]: true
        }));
      });
      
      await api.post('/marking-groups/enhanced/start', { 
        group_ids: groupIds 
      });
      
      success(`Marking started successfully for ${groupIds.length} group(s). The process is running in the background.`);
      
      // Enable auto-refresh
      setAutoRefresh(true);
      
      // Refresh data
      await fetchGroups();
      
      // Check for immediate failures after a short delay
      setTimeout(async () => {
        await checkMarkingProgress();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to start marking:', err);
      let errorMessage = 'Failed to start marking: ' + (err.response?.data?.message || err.message);
      
      // Handle specific error cases with action buttons
      let actionButton = null;
      if (err.response?.data?.message?.includes('no marking schemes configured')) {
        errorMessage = 'No marking schemes are configured for the selected groups.';
        actionButton = {
          label: 'Create Marking Schemes',
          onClick: () => navigate('/schemes')
        };
      } else if (err.response?.data?.message?.includes('No scripts found')) {
        errorMessage = 'No scripts found in the selected groups.';
        actionButton = {
          label: 'Upload Scripts',
          onClick: () => navigate('/uploads')
        };
      }
      
      setError(errorMessage);
      showError(errorMessage, 8000, actionButton);
      
      // Reset marking progress state
      groupIds.forEach(groupId => {
        setMarkingInProgress(prev => ({
          ...prev,
          [groupId]: false
        }));
      });
    }
  };

  // Start marking for batches
  const startBatchMarking = async (groupId, batchNames) => {
    if (!batchNames || batchNames.length === 0) return;
    
    try {
      setError(null);
      info(`Starting marking for ${batchNames.length} batch(es)...`);
      
      await api.post('/marking-batches/start', {
        group_id: groupId,
        batch_names: batchNames
      });
      
      success(`Marking started successfully for ${batchNames.length} batch(es). The process is running in the background.`);
      
      // Enable auto-refresh
      setAutoRefresh(true);
      
      // Refresh data
      await fetchGroups();
      await fetchBatches(groupId);
      
    } catch (err) {
      console.error('Failed to start batch marking:', err);
      let errorMessage = 'Failed to start batch marking: ' + (err.response?.data?.message || err.message);
      
      // Handle specific error cases with action buttons
      let actionButton = null;
      if (err.response?.data?.message?.includes('no marking schemes configured')) {
        errorMessage = 'No marking schemes are configured for the selected batches.';
        actionButton = {
          label: 'Create Marking Schemes',
          onClick: () => navigate('/schemes')
        };
      } else if (err.response?.data?.message?.includes('No scripts found')) {
        errorMessage = 'No scripts found in the selected batches.';
        actionButton = {
          label: 'Upload Scripts',
          onClick: () => navigate('/uploads')
        };
      }
      
      setError(errorMessage);
      showError(errorMessage, 8000, actionButton);
    }
  };

  // Get selected group IDs
  const selectedGroupIds = Object.keys(selectedGroups).filter(id => selectedGroups[id]);

  // Get selected batch names for a group
  const getSelectedBatchNames = (groupId) => {
    return Object.keys(selectedBatches[groupId] || {}).filter(name => selectedBatches[groupId]?.[name]);
  };

  // Table columns for groups
  const groupColumns = [
    {
      key: 'group_info',
      title: 'Group Information',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getGroupTypeColor(row.group_type)}`}>
              {row.group_type === 'batch' ? (
                <Users className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate cursor-pointer transition-colors"
                onClick={() => navigate(`/uploads/group/${row.id}`)}
                title="Click to view group uploads"
              >
                {row.name}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(row.group_type)}`}>
                {row.group_type}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {row.upload_count || 0} uploads • {row.page_count || 0} pages
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'marking_status',
      title: 'Marking Status',
      render: (value, row) => (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMarkingStatusColor(row.marking_status)}`}>
            {getMarkingStatusIcon(row.marking_status)}
            {row.marking_status?.replace('_', ' ') || 'Not Started'}
          </span>
        </div>
      )
    },
    {
      key: 'progress',
      title: 'Progress',
      render: (value, row) => {
        const progress = row.marking_progress || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {row.group_type === 'batch' ? (
            <button
              onClick={() => toggleGroupExpansion(row.id)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Users className="h-4 w-4 mr-1" />
              View Batches
            </button>
          ) : (
            <button
              onClick={() => startGroupMarking([row.id])}
              disabled={markingInProgress[row.id] || row.marking_status === 'processing'}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {markingInProgress[row.id] ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Mark
            </button>
          )}
          
          <Link
            to={`/uploads/group/${row.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Upload className="h-4 w-4 mr-1" />
            Uploads
          </Link>
        </div>
      )
    }
  ];

  // Table columns for batches
  const batchColumns = [
    {
      key: 'batch_info',
      title: 'Batch Information',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate cursor-pointer transition-colors"
              onClick={() => navigate(`/uploads/group/${row.groupId}/batch/${encodeURIComponent(row.batchName)}`)}
              title="Click to view batch details"
            >
              {row.batchName}
            </h4>
            <p className="text-sm text-gray-500">
              {row.uploadCount || 0} uploads • {row.imageCount || 0} images
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'marking_status',
      title: 'Marking Status',
      render: (value, row) => (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMarkingStatusColor(row.markingStatus)}`}>
            {getMarkingStatusIcon(row.markingStatus)}
            {row.markingStatus?.replace('_', ' ') || 'Not Started'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => startBatchMarking(row.groupId, [row.batchName])}
            disabled={row.markingStatus === 'processing'}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {row.markingStatus === 'processing' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Mark
          </button>
          
          <Link
            to={`/uploads/group/${row.groupId}/batch/${encodeURIComponent(row.batchName)}`}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Users className="h-4 w-4 mr-1" />
            View
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/marking')}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Marking
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {exam?.name || 'Exam Groups'}
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage and monitor marking for groups in this exam
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                Auto-refresh
              </label>
              
              <button 
                onClick={fetchGroups} 
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              {selectedGroupIds.length > 0 && (
                <button
                  onClick={() => startGroupMarking(selectedGroupIds)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Play className="w-4 h-4" />
                  Mark Selected ({selectedGroupIds.length})
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Groups Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
            <p className="text-sm text-gray-600">Select groups to mark or view their batches</p>
          </div>
          
          <CardTable
            data={groups}
            columns={groupColumns}
            loading={loading}
            searchable={true}
            selectable={true}
            onSelectionChange={setSelectedGroups}
            searchPlaceholder="Search groups..."
            searchFields={['name', 'description']}
            bulkActions={[
              {
                label: 'Mark Selected',
                variant: 'default',
                icon: Play,
                onClick: (selected) => {
                  const groupIds = selected.map(item => item.id);
                  startGroupMarking(groupIds);
                }
              }
            ]}
            onRowClick={(row) => {
              if (row.group_type === 'batch') {
                toggleGroupExpansion(row.id);
              }
            }}
            emptyMessage="No groups found in this exam"
          />
        </motion.div>

        {/* Expanded Batches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {Object.entries(expandedGroups).map(([groupId, isExpanded]) => {
            if (!isExpanded || !batches[groupId]) return null;
            
            const group = groups.find(g => g.id === groupId);
            if (!group) return null;
            
            return (
              <motion.div
                key={groupId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900">
                        Batches for {group.name}
                      </h3>
                      <p className="text-sm text-purple-700">
                        {batches[groupId].length} batch(es) available
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const selectedBatchNames = getSelectedBatchNames(groupId);
                          if (selectedBatchNames.length > 0) {
                            startBatchMarking(groupId, selectedBatchNames);
                          }
                        }}
                        disabled={getSelectedBatchNames(groupId).length === 0}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        Mark Selected ({getSelectedBatchNames(groupId).length})
                      </button>
                      
                      <button
                        onClick={() => toggleGroupExpansion(groupId)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-white border border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Collapse
                      </button>
                    </div>
                  </div>
                </div>
                
                <CardTable
                  data={batches[groupId].map(batch => ({
                    ...batch,
                    groupId: groupId
                  }))}
                  columns={batchColumns}
                  loading={false}
                  searchable={true}
                  selectable={true}
                  onSelectionChange={(selections) => {
                    setSelectedBatches(prev => ({
                      ...prev,
                      [groupId]: selections
                    }));
                  }}
                  searchPlaceholder="Search batches..."
                  searchFields={['name']}
                  bulkActions={[
                    {
                      label: 'Mark Selected',
                      variant: 'default',
                      icon: Play,
                      onClick: (selected) => {
                        const batchNames = selected.map(item => item.name);
                        startBatchMarking(groupId, batchNames);
                      }
                    }
                  ]}
                  emptyMessage="No batches found"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
