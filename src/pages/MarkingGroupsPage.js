import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Circle, Loader2, Upload, AlertTriangle, RefreshCw, ChevronRight, BarChart3 } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import EnhancedDataTable from '../components/EnhancedDataTable';
import api from '../api/axios';
import { Link } from 'react-router-dom';

export default function MarkingGroupsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('group_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock Data Check
      if (localStorage.getItem('token') === 'mock-jwt-token') {
        const mockRows = [
          {
            group_id: 'mock-group-1',
            group_name: 'Mathematics Class 101',
            status: 'processing',
            uploads: 5,
            scripts_total: 150,
            scripts_marked: 45,
            pages_total: 450,
            pages_done: 135
          },
          {
            group_id: 'mock-group-2',
            group_name: 'Physics Lab Reports',
            status: 'idle',
            uploads: 12,
            scripts_total: 300,
            scripts_marked: 0,
            pages_total: 1200,
            pages_done: 0
          }
        ];
        setRows(mockRows);
        setPagination(prev => ({
          ...prev,
          total: mockRows.length,
          total_pages: 1
        }));
        setLoading(false);
        return;
      }

      // backend route: GET /marking-groups/progress
      const res = await api.get('/marking-groups/progress');
      const data = res.data?.groups || res.data?.data?.groups || [];
      setRows(data);

      // Set pagination info
      setPagination(prev => ({
        ...prev,
        total: data.length,
        total_pages: Math.ceil(data.length / prev.per_page)
      }));
    } catch (err) {
      console.error('Failed to load marking groups:', err);
      setError('Failed to load marking groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page, perPage = pagination.per_page) => {
    setPagination(prev => ({ ...prev, page, per_page: perPage }));
  };

  const toggleAll = (checked) => {
    const next = {};
    rows.forEach(r => { next[r.group_id] = checked; });
    setSelected(next);
  };

  const toggleOne = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const startGroups = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      setBulkBusy(true);
      await api.post('/marking-groups/start', { group_ids: ids });
      await fetchData();
    } catch (err) {
      console.error('Failed to start marking:', err);
      setError('Failed to start marking');
    } finally {
      setBulkBusy(false);
    }
  };

  const pauseGroups = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      setBulkBusy(true);
      await api.post('/marking-groups/pause', { group_ids: ids });
      await fetchData();
    } catch (err) {
      console.error('Failed to pause marking:', err);
      setError('Failed to pause marking');
    } finally {
      setBulkBusy(false);
    }
  };

  const resumeGroups = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      setBulkBusy(true);
      await api.post('/marking-groups/resume', { group_ids: ids });
      await fetchData();
    } catch (err) {
      console.error('Failed to resume marking:', err);
      setError('Failed to resume marking');
    } finally {
      setBulkBusy(false);
    }
  };

  const statusPill = (st) => {
    const map = {
      idle: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      paused: 'bg-amber-100 text-amber-700',
    };
    let icon = <Circle className="w-4 h-4 mr-1" />;
    if (st === 'completed') icon = <CheckCircle className="w-4 h-4 mr-1" />;
    else if (st === 'processing') icon = <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
    else if (st === 'paused') icon = <span className="w-4 h-4 mr-1 font-bold">||</span>; // Pause icon

    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[st] || map.idle}`}>{icon}{st || 'idle'}</span>;
  };

  const availableFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'idle', label: 'Idle' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'paused', label: 'Paused' }
      ]
    },
    {
      key: 'uploads_min',
      label: 'Min Uploads',
      type: 'number'
    },
    {
      key: 'uploads_max',
      label: 'Max Uploads',
      type: 'number'
    }
  ];

  const columns = [
    {
      key: 'group_name',
      title: 'Group Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">ID: {row.group_id?.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => statusPill(value)
    },
    {
      key: 'uploads',
      title: 'Uploads',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value || 0}</span>
      )
    },
    {
      key: 'scripts_marked',
      title: 'Scripts Marked',
      sortable: true,
      render: (value, row) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">of {row.scripts_total || 0}</div>
        </div>
      )
    },
    {
      key: 'pages_done',
      title: 'OCR Progress',
      sortable: true,
      render: (value, row) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">of {row.pages_total || 0}</div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {row.status === 'processing' ? (
            <button
              onClick={() => pauseGroups([row.group_id])}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200"
            >
              Pause
            </button>
          ) : row.status === 'paused' ? (
            <button
              onClick={() => resumeGroups([row.group_id])}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={() => startGroups([row.group_id])}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}

          <Link
            to={`/uploads/group/${row.group_id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"
          >
            <Upload className="w-3.5 h-3.5" /> Uploads <ChevronRight className="w-3 h-3" />
          </Link>
          <Link
            to={`/anomalies/${row.group_id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Anomalies <ChevronRight className="w-3 h-3" />
          </Link>
          <Link
            to={`/results/group/${row.group_id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Results <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading || bulkBusy} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Marking</h1>
            <p className="text-sm text-gray-600">Control and monitor marking per group</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button disabled={selectedIds.length === 0 || bulkBusy} onClick={() => startGroups(selectedIds)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              <Play className="w-4 h-4" /> Start Selected ({selectedIds.length})
            </button>
            <button disabled={selectedIds.length === 0 || bulkBusy} onClick={() => pauseGroups(selectedIds)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-700 bg-amber-100 hover:bg-amber-200 disabled:opacity-50">
              Pause ({selectedIds.length})
            </button>
            <button disabled={selectedIds.length === 0 || bulkBusy} onClick={() => resumeGroups(selectedIds)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-700 bg-green-100 hover:bg-green-200 disabled:opacity-50">
              Resume ({selectedIds.length})
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}

        <EnhancedDataTable
          data={rows}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          onSearch={handleSearch}
          onFilter={handleFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          searchTerm={searchTerm}
          filters={filters}
          availableFilters={availableFilters}
          title="Marking Groups"
          subtitle="Control and monitor marking per group"
          showSearch={true}
          showFilters={true}
          showPagination={true}
          showPerPageSelector={true}
          emptyStateIcon="📊"
          emptyStateMessage="No groups yet. Upload some scripts to get started."
          onRefresh={fetchData}
          bulkActions={[
            {
              label: 'Start Selected',
              action: () => startGroups(selectedIds),
              disabled: selectedIds.length === 0 || bulkBusy,
              icon: Play,
              variant: 'primary'
            },
            {
              label: 'Pause',
              action: () => pauseGroups(selectedIds),
              disabled: selectedIds.length === 0 || bulkBusy,
              variant: 'secondary' // needs styling support in EnhancedDataTable or passed class
            }
          ]}
          onBulkSelect={toggleAll}
          onRowSelect={toggleOne}
          selectedRows={selected}
        />
      </div>
    </div>
  );
}
