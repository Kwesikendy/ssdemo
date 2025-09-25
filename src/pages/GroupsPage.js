import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, FileText, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import api from '../api/axios';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, group: null });
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false });
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

  const fetchGroups = async () => {
    try {
      setLoading(true);
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
      setError('Failed to fetch groups. Please try again.');
      console.error('Fetch groups error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/groups/stats');
      const body = response.data;
      setStats(body.data || body);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleOpenCreate = () => {
    setFormModal({ open: true, mode: 'create', group: null, name: '', description: '', has_math: false });
  };

  const handleOpenEdit = (group) => {
    setFormModal({ open: true, mode: 'edit', group, name: group.name, description: group.description || '', has_math: !!group.has_math });
  };

  const handleDeleteGroup = async (group) => {
    try {
      await api.delete(`/groups/${group.id}`);
      setDeleteModal({ open: false, group: null });
      fetchGroups();
      setError(null);
    } catch (err) {
      setError('Failed to delete group. Please try again.');
      console.error('Delete group error:', err);
    }
  };

  const handleViewGroup = (group) => {
    navigate(`/groups/${group.id}`);
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    try {
  const payload = { name: formModal.name.trim(), description: formModal.description.trim(), has_math: !!formModal.has_math };
      if (!payload.name) {
        setError('Group name is required.');
        return;
      }
      if (formModal.mode === 'create') {
        await api.post('/groups', payload);
      } else if (formModal.mode === 'edit' && formModal.group) {
        await api.put(`/groups/${formModal.group.id}`, payload);
      }
  setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false });
      await fetchGroups();
      await fetchStats();
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save group.';
      setError(msg);
      console.error('Save group error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      key: 'name',
      title: 'Group Name',
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
      key: 'has_math',
      title: 'Has Math',
      sortable: false,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {value ? 'Yes' : 'No'}
        </span>
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
      key: 'scheme_count',
      title: 'Marking Schemes',
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
            onClick={() => handleViewGroup(row)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="View Group"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
            title="Edit Group"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, group: row })}
            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
            title="Delete Group"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && groups.length === 0} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 sm:truncate">
                Groups
              </h1>
              <p className="mt-2 text-gray-600">
                Organize your scripts and marking schemes into groups
              </p>
            </motion.div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Group
            </motion.button>
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
          <StatsCard
            title="Total Groups"
            value={stats.total_groups || 0}
            change={stats.groups_change}
            icon={Users}
            iconColor="indigo"
          />
          <StatsCard
            title="Total Uploads"
            value={stats.total_uploads || 0}
            change={stats.uploads_change}
            icon={FileText}
            iconColor="blue"
          />
          <StatsCard
            title="Active Groups"
            value={stats.active_groups || 0}
            change={stats.active_change}
            icon={Users}
            iconColor="green"
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
                onClick={() => setSearchTerm('')}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, group: null })}
        title="Delete Group"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the group{' '}
                <span className="font-medium text-gray-900">
                  {deleteModal.group?.name}
                </span>
                ? This action cannot be undone and will affect all associated uploads and marking schemes.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={() => handleDeleteGroup(deleteModal.group)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteModal({ open: false, group: null })}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Group Form Modal */}
      <Modal
        isOpen={formModal.open}
  onClose={() => setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false })}
        title={formModal.mode === 'create' ? 'New Group' : 'Edit Group'}
      >
        <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formModal.name}
              onChange={(e) => setFormModal(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Mathematics 2025"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formModal.description}
              onChange={(e) => setFormModal(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center">
            <input
              id="has_math"
              type="checkbox"
              checked={!!formModal.has_math}
              onChange={(e) => setFormModal(prev => ({ ...prev, has_math: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="has_math" className="ml-2 block text-sm text-gray-700">
              This group contains mathematics content
            </label>
          </div>
          <div className="sm:flex sm:flex-row-reverse sm:space-x-3 sm:space-x-reverse pt-2">
            <button type="submit" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              {formModal.mode === 'create' ? 'Create' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false })} className="mt-3 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
