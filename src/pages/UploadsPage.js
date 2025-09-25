import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
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
  const [groups, setGroups] = useState([]);
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
  }, [pagination.page, pagination.per_page, searchTerm]);

  const fetchGroups = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: searchTerm
      };

      const response = await api.get('/groups', { params });
      const body = response.data;
      if (body && body.groups) {
        setGroups(body.groups);
        setPagination(body.pagination || pagination);
      } else if (body && body.data) {
        setGroups(body.data.groups || []);
        setPagination(body.meta || pagination);
      } else {
        setGroups([]);
      }
      setError(null);
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

  const handleRefresh = () => {
    fetchGroups(false);
    fetchStats();
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
      key: 'name',
      title: 'Group',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'upload_count',
      title: 'Uploads',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value || 0}</span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewGroupUploads(row)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="View Uploads"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <LoadingOverlay isLoading={loading && groups.length === 0} />
      
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

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <DataTable
            data={groups}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </motion.div>
      </div>
    </div>
  );
}
