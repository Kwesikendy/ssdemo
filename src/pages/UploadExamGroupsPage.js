import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Eye, RefreshCw, FileText, Trash2, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CardTable from '../components/CardTable';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function UploadExamGroupsPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  
  const [exam, setExam] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  const fetchExamDetails = useCallback(async () => {
    try {
      const response = await api.get(`/examgroups/${examId}`);
      setExam(response.data);
    } catch (err) {
      console.error('Failed to fetch exam details:', err);
      setError('Failed to load exam details');
    }
  }, [examId]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get(`/examgroups/${examId}/exams`);
      setGroups(response.data.groups || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    }
  }, [examId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchExamDetails(), fetchGroups()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchExamDetails, fetchGroups]);

  const handleViewGroupUploads = (group) => {
    navigate(`/uploads/group/${group.id}`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchExamDetails(), fetchGroups()]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleCreateGroup = () => {
    // Navigate to groups page with exam pre-selected
    navigate(`/groups?exam_id=${examId}`);
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
      key: 'name',
      title: 'Group',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getGroupTypeColor(row.exam_type)}`}>
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
                {value}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(row.exam_type)}`}>
                {row.exam_type}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {row.description || 'No description'}
            </p>
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

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px] py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => navigate('/uploads')}
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Uploads
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 
                    className="text-3xl font-bold text-indigo-600 hover:text-indigo-800 sm:truncate cursor-pointer transition-colors"
                    onClick={() => navigate('/uploads')}
                    title="Click to go back to uploads"
                  >
                    {exam?.name || 'Exam Groups'}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Groups in this exam - {groups.length} group(s)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
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

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CardTable
            data={groups}
            columns={columns}
            loading={loading}
            searchable={true}
            selectable={true}
            onSelectionChange={setSelectedGroups}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            searchPlaceholder="Search groups..."
            searchFields={['name', 'description']}
            bulkActions={[
              {
                label: 'Delete Selected',
                variant: 'danger',
                icon: Trash2,
                onClick: (selected) => {
                  // Handle bulk delete
                  console.log('Delete selected groups:', selected);
                }
              }
            ]}
            emptyMessage="No groups found in this exam"
          />
        </motion.div>
      </div>
    </div>
  );
}
