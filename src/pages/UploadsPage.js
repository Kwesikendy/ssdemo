import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Eye, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CardTable from '../components/CardTable';
import StatsCard, { UploadsStatsCard, CandidatesStatsCard, MarkedStatsCard } from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function UploadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [hierarchy, setHierarchy] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [searchTerm]);

  const fetchGroups = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch hierarchical structure instead of flat groups
      const response = await api.get('/exams/hierarchy');
      const hierarchyData = response.data.hierarchy || [];
      
      // Create a flat list with groups and exams
      const flatList = [];

      hierarchyData.forEach(exam => {
        if (exam.is_default) {
          // Default exam groups go directly to the list
          if (exam.groups && exam.groups.length > 0) {
            exam.groups.forEach(group => {
              flatList.push({
                ...group,
                exam_name: exam.name,
                exam_id: exam.id,
                is_default_exam: true,
                is_group: true
              });
            });
          }
        } else {
          // Add exam as a row
          flatList.push({
            id: exam.id,
            name: exam.name,
            exam_name: exam.name,
            exam_id: exam.id,
            is_default_exam: false,
            is_group: false,
            group_count: exam.groups ? exam.groups.length : 0,
            groups: exam.groups || [] // Store groups for "View Groups" action
          });
        }
      });

      setHierarchy(flatList);
      setError(null);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        total: flatList.length,
        total_pages: Math.ceil(flatList.length / prev.per_page)
      }));
    } catch (err) {
      const errorMsg = 'Failed to fetch groups. Please try again.';
      setError(errorMsg);
      if (!showLoader) {
        toast.error(errorMsg);
      }
      console.error('Fetch groups error:', err);
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
  const response = await api.get('/uploads/stats');
  const body = response.data;
  setStats(body.data || body);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleViewGroupUploads = (group) => {
    navigate(`/uploads/group/${group.id}`);
  };

  const handleViewExamGroups = (exam) => {
    navigate(`/uploads/exam/${exam.id}`);
  };

  const handleRefresh = () => {
    fetchGroups(false);
    fetchStats();
  };

  const getGroupTypeColor = (groupType) => {
    switch (groupType) {
      case 'batch':
        return 'bg-blue-100 text-blue-800';
      case 'simple':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const columns = [
    {
      key: 'item_info',
      title: 'Name',
      render: (value, row) => {
        if (row.is_group) {
          // Group row
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getGroupTypeColor(row.group_type)}`}>
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate cursor-pointer transition-colors"
                    onClick={() => handleViewGroupUploads(row)}
                    title="Click to view group uploads"
                  >
                    {row.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(row.group_type)}`}>
                    {row.group_type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {row.description || 'No description'}
                </p>
              </div>
            </div>
          );
        } else {
          // Exam row
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate cursor-pointer transition-colors"
                    onClick={() => handleViewExamGroups(row)}
                    title="Click to view exam groups"
                  >
                    {row.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Exam
                  </span>
                </div>
                <p className="text-sm text-indigo-600">
                  {row.group_count} group(s)
                </p>
              </div>
            </div>
          );
        }
      }
    },
    {
      key: 'upload_count',
      title: 'Uploads',
      render: (value, row) => {
        if (row.is_group) {
          return (
            <span className="text-sm text-gray-900">{row.upload_count || 0}</span>
          );
        } else {
          return (
            <span className="text-sm text-gray-500">-</span>
          );
        }
      }
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (value, row) => {
        if (row.is_group) {
          return (
            <span className="text-sm text-gray-500">{formatDate(row.created_at)}</span>
          );
        } else {
          return (
            <span className="text-sm text-gray-500">{formatDate(row.created_at)}</span>
          );
        }
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => {
        if (!row.is_group) {
          // Exam row - show view groups action (as backup to clicking the name)
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewExamGroups(row)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                View Groups
              </button>
            </div>
          );
        } else {
          // Group row - no action needed since name is clickable
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 italic">Click name to view</span>
            </div>
          );
        }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <LoadingOverlay isLoading={loading && hierarchy.length === 0} />
      
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
        <h1 className="text-3xl font-bold text-gray-900 sm:truncate">Script Uploads</h1>
        <p className="mt-2 text-gray-600">Select a group to view its uploads and add more scripts</p>
            </motion.div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
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

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <UploadsStatsCard 
            uploads={stats.total_uploads || 0}
            change={stats.uploads_change}
          />
          <CandidatesStatsCard 
            candidates={stats.total_candidates || 0}
            change={stats.candidates_change}
          />
          <MarkedStatsCard 
            marked={stats.marked_scripts || 0}
            total={stats.total_scripts || 0}
            change={stats.progress_change}
          />
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Groups
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by group name or description..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  toast.info('Search cleared');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Search
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CardTable
            data={hierarchy}
            columns={columns}
            loading={loading}
            searchable={true}
            selectable={false} // No checkboxes on uploads page
            searchPlaceholder="Search groups and exams..."
            searchFields={['name', 'description']}
            onRowClick={(row) => {
              if (!row.is_group) {
                // If it's an exam, navigate to exam groups page
                handleViewExamGroups(row);
              }
            }}
            emptyMessage="No groups or exams found"
          />
        </motion.div>
      </div>
    </div>
  );
}
