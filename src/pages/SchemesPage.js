import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Filter, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import api from '../api/axios';
import Select from 'react-select';

export default function SchemesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [groups, setGroups] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, scheme: null });
  const [viewModal, setViewModal] = useState({ open: false, scheme: null });
  const [editModal, setEditModal] = useState({ open: false, scheme: null, saving: false });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchSchemes();
    fetchGroups();
    fetchStats();
  }, [pagination.page, pagination.per_page, searchTerm, filterGroup]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: searchTerm,
        group_id: filterGroup !== 'all' ? filterGroup : undefined
      };

      const response = await api.get('/marking-schemes', { params });
      
      // Handle different response formats
      let schemesData = [];
      let paginationData = pagination;
      
      if (response.data.schemes) {
        schemesData = response.data.schemes;
        paginationData = response.data.pagination || pagination;
      } else if (Array.isArray(response.data)) {
        schemesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        schemesData = response.data.data;
        if (response.data.meta) {
          paginationData = {
            page: response.data.meta.page || pagination.page,
            per_page: response.data.meta.per_page || pagination.per_page,
            total: response.data.meta.total || 0,
            total_pages: response.data.meta.total_pages || 0
          };
        }
      }
      
      setSchemes(schemesData);
      // Update stats from the fetched list
      try {
        const total = schemesData.length || 0;
        const active = schemesData.filter(s => s.is_active === true).length;
        // naive total questions: try to read questions.count or questions list length
        const totalQuestions = schemesData.reduce((sum, s) => {
          const q = s.questions;
          if (!q) return sum;
          if (Array.isArray(q)) return sum + q.length; // legacy
          if (typeof q === 'object') {
            if (Array.isArray(q.questions)) return sum + q.questions.length;
            if (typeof q.total === 'number') return sum + q.total;
            return sum;
          }
          return sum;
        }, 0);
        setStats({ total_schemes: total, active_schemes: active, total_questions: totalQuestions });
      } catch (_) {
        // ignore stats calc errors
      }
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch marking schemes. Please try again.');
      console.error('Fetch schemes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups', { params: { per_page: 100 } });
      setGroups(response.data.groups || []);
    } catch (err) {
      console.error('Fetch groups error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // Try to fetch stats, but don't fail if endpoint doesn't exist
      const response = await api.get('/marking-schemes/stats');
      setStats(response.data);
    } catch (err) {
      // Set default stats if endpoint doesn't exist
      setStats({
        total_schemes: 0,
        active_schemes: 0,
        total_questions: 0
      });
      console.warn('Stats endpoint not available:', err);
    }
  };

  const handleCreateScheme = () => {
    navigate('/upload-scheme');
  };

  const handleEditScheme = (scheme) => {
    setEditModal({ open: true, scheme: { ...scheme }, saving: false });
  };

  const handleDeleteScheme = async (scheme) => {
    try {
      await api.delete(`/marking-schemes/${scheme.id}`);
      setDeleteModal({ open: false, scheme: null });
      fetchSchemes();
      setError(null);
    } catch (err) {
      setError('Failed to delete marking scheme. Please try again.');
      console.error('Delete scheme error:', err);
    }
  };

  const handleViewScheme = (scheme) => {
    setViewModal({ open: true, scheme });
  };

  const saveEdit = async () => {
    if (!editModal.scheme) return;
    try {
      setEditModal(prev => ({ ...prev, saving: true }));
      const payload = {
        name: editModal.scheme.name,
        scheme_text: editModal.scheme.scheme_text,
        custom_instructions: editModal.scheme.custom_instructions || '',
        has_math: editModal.scheme.has_math,
        group_ids: (editModal.scheme.groups || []).map(g => g.id),
        questions: editModal.scheme.questions || {}
      };
      await api.put(`/marking-schemes/${editModal.scheme.id}`, payload);
      setEditModal({ open: false, scheme: null, saving: false });
      fetchSchemes();
    } catch (err) {
      console.error('Save edit error:', err);
      setEditModal(prev => ({ ...prev, saving: false }));
      setError('Failed to update marking scheme.');
    }
  };

  const handleDownloadScheme = async (scheme) => {
    try {
      const response = await api.get(`/marking-schemes/${scheme.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${scheme.name}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download marking scheme. Please try again.');
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
      title: 'Scheme Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.subject || 'No subject'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'group_name',
      title: 'Group',
      sortable: true,
      render: (value, row) => {
        // Handle different group data formats
        let groupName = value;
        if (!groupName && row.groups && row.groups.length > 0) {
          groupName = row.groups[0].name;
        }
        return (
          <span className="text-sm text-gray-900">{groupName || 'No group'}</span>
        );
      }
    },
    {
      key: 'total_marks',
      title: 'Total Marks',
      sortable: true,
      render: (value, row) => {
        // Calculate from questions if not provided
        let totalMarks = value || 0;
        if (!totalMarks && row.questions && Array.isArray(row.questions)) {
          totalMarks = row.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
        }
        return (
          <span className="text-sm text-gray-900">{totalMarks}</span>
        );
      }
    },
    {
      key: 'question_count',
      title: 'Questions',
      sortable: true,
      render: (value, row) => {
        // Calculate from questions if not provided
        let questionCount = value || 0;
        if (!questionCount && row.questions && Array.isArray(row.questions)) {
          questionCount = row.questions.length;
        }
        return (
          <span className="text-sm text-gray-900">{questionCount}</span>
        );
      }
    },
    {
      key: 'usage_count',
      title: 'Used In',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">{value || 0} uploads</span>
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
            onClick={() => handleViewScheme(row)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="View Scheme"
          >
            <FileText className="h-4 w-4" />
          </button>
          {row?.questions && typeof row.questions === 'object' && row.questions.origin === 'image' && (
            <button
              onClick={() => handleDownloadScheme(row)}
              className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
              title="Download Scheme"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleEditScheme(row)}
            className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
            title="Edit Scheme"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, scheme: row })}
            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
            title="Delete Scheme"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && schemes.length === 0} />
      
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
                Marking Schemes
              </h1>
              <p className="mt-2 text-gray-600">
                Create and manage marking schemes for your examinations
              </p>
            </motion.div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={handleCreateScheme}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Scheme
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
            title="Total Schemes"
            value={stats.total_schemes || 0}
            change={stats.schemes_change}
            icon={FileText}
            iconColor="purple"
          />
          <StatsCard
            title="Active Schemes"
            value={stats.active_schemes || 0}
            change={stats.active_change}
            icon={FileText}
            iconColor="green"
          />
          <StatsCard
            title="Total Questions"
            value={stats.total_questions || 0}
            change={stats.questions_change}
            icon={FileText}
            iconColor="blue"
          />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Schemes
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Search by scheme name or subject..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Group
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterGroup}
                  onChange={(e) => { setFilterGroup(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">All Groups</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGroup('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Clear Filters
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
            data={schemes}
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
        onClose={() => setDeleteModal({ open: false, scheme: null })}
        title="Delete Marking Scheme"
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
                Are you sure you want to delete the marking scheme{' '}
                <span className="font-medium text-gray-900">
                  {deleteModal.scheme?.name}
                </span>
                ? This action cannot be undone and may affect existing uploads that use this scheme.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={() => handleDeleteScheme(deleteModal.scheme)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteModal({ open: false, scheme: null })}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* View Scheme Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, scheme: null })}
        title={viewModal.scheme?.name || 'View Marking Scheme'}
      >
        <div className="p-6 space-y-3">
          <div className="text-sm text-gray-600"><span className="font-medium">Has Math:</span> {viewModal.scheme?.has_math ? 'Yes' : 'No'}</div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Groups</div>
            <div className="flex flex-wrap gap-2">
              {(viewModal.scheme?.groups || []).map(g => (
                <span key={g.id} className="px-2 py-1 bg-gray-100 rounded text-xs">{g.name}</span>
              ))}
              {(!viewModal.scheme?.groups || viewModal.scheme.groups.length === 0) && (
                <span className="text-sm text-gray-500">No groups</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Custom Instructions</div>
            {viewModal.scheme?.custom_instructions ? (
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-auto">{viewModal.scheme.custom_instructions}</pre>
            ) : (
              <span className="text-sm text-gray-500 italic">No custom instructions</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Scheme Text</div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-200 max-h-80 overflow-auto">{viewModal.scheme?.scheme_text}</pre>
          </div>
        </div>
      </Modal>

      {/* Edit Scheme Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, scheme: null, saving: false })}
        title={`Edit: ${editModal.scheme?.name || ''}`}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editModal.scheme?.name || ''}
              onChange={(e) => setEditModal(prev => ({ ...prev, scheme: { ...prev.scheme, name: e.target.value } }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="edit-has-math"
              type="checkbox"
              checked={!!editModal.scheme?.has_math}
              onChange={(e) => setEditModal(prev => ({ ...prev, scheme: { ...prev.scheme, has_math: e.target.checked } }))}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
            />
            <label htmlFor="edit-has-math" className="text-sm text-gray-700">Has Math</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
            <Select
              isMulti
              options={groups.map(g => ({ value: g.id, label: g.name, raw: g }))}
              value={(editModal.scheme?.groups || []).map(g => ({ value: g.id, label: g.name, raw: g }))}
              onChange={(vals) => {
                const selectedGroups = (vals || []).map(v => v.raw || { id: v.value, name: v.label });
                setEditModal(prev => ({ ...prev, scheme: { ...prev.scheme, groups: selectedGroups } }));
              }}
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Instructions</label>
            <textarea
              rows={3}
              value={editModal.scheme?.custom_instructions || ''}
              onChange={(e) => setEditModal(prev => ({ ...prev, scheme: { ...prev.scheme, custom_instructions: e.target.value } }))}
              placeholder="Enter any additional instructions for the AI when marking papers (optional)..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Text</label>
            <textarea
              rows={6}
              value={editModal.scheme?.scheme_text || ''}
              onChange={(e) => setEditModal(prev => ({ ...prev, scheme: { ...prev.scheme, scheme_text: e.target.value } }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              onClick={() => setEditModal({ open: false, scheme: null, saving: false })}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50"
              disabled={editModal.saving}
              onClick={saveEdit}
            >
              {editModal.saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
