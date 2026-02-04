import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, BarChart3, ArrowLeft, Filter, Search } from 'lucide-react';
import EnhancedDataTable from '../components/EnhancedDataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import api from '../api/axios';

export default function ResultsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  // Shared UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Group list mode
  const [groups, setGroups] = useState([]);
  const [groupsPagination, setGroupsPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });

  // Group results mode
  const [group, setGroup] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });

  const inGroupMode = !!groupId;

  useEffect(() => {
    setError(null);
    if (!inGroupMode) {
      loadGroups();
      return;
    }
    // Group mode
    loadGroupMeta();
    loadGroupResults();
  }, [groupId, groupsPagination.page, pagination.page, searchTerm, gradeFilter, filters, sortField, sortDirection]);

  const loadGroups = async () => {
    try {
      setLoading(true);

      // Mock Data Check
      if (localStorage.getItem('token') === 'mock-jwt-token') {
        const mockGroups = [
          {
            id: 'mock-group-1',
            name: 'Mathematics Class 101',
            has_math: true,
            upload_count: 5,
            scheme_count: 1
          },
          {
            id: 'mock-group-2',
            name: 'Physics Lab Reports',
            has_math: false,
            upload_count: 12,
            scheme_count: 0
          }
        ];
        setGroups(mockGroups);
        setGroupsPagination(prev => ({ ...prev, total: 2, total_pages: 1 }));
        setLoading(false);
        return;
      }

      const res = await api.get('/results/groups', { params: { search: searchTerm } });
      const list = res.data?.groups || [];
      const total = res.data?.total || list.length;
      const start = (groupsPagination.page - 1) * groupsPagination.per_page;
      const pageItems = list.slice(start, start + groupsPagination.per_page);
      setGroups(pageItems);
      setGroupsPagination(prev => ({ ...prev, total, total_pages: Math.ceil(total / prev.per_page) }));
    } catch (err) {
      console.error('Failed to load groups', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMeta = async () => {
    try {
      // fetch group basic info for header
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
    } catch (err) {
      // non-fatal
    }
  };

  const loadGroupResults = async () => {
    try {
      setLoading(true);

      // Mock Data Check
      if (localStorage.getItem('token') === 'mock-jwt-token') {
        const mockResults = Array.from({ length: 15 }).map((_, i) => ({
          candidate_id: `mock-cand-${i}`,
          index_number: `IDX-${2023000 + i}`,
          total_awarded: 75 + (i % 25),
          total_max: 100,
          percentage: 75 + (i % 25),
          updated_at_unix: Math.floor(Date.now() / 1000) - (i * 3600)
        }));

        const rows = mockResults.map(r => ({
          ...r,
          __grade: r.percentage >= 90 ? 'A' : r.percentage >= 80 ? 'B' : r.percentage >= 70 ? 'C' : r.percentage >= 60 ? 'D' : 'F'
        }));
        const filtered = gradeFilter === 'all' ? rows : rows.filter(r => r.__grade === gradeFilter);
        setResults(filtered);
        setPagination({
          page: 1,
          per_page: 10,
          total: filtered.length,
          total_pages: Math.ceil(filtered.length / 10)
        });
        setStats({
          average_score: 82,
          pass_rate: 95,
          highest_score: 98,
          completed_candidates: 15,
          total_candidates: 15
        });
        setLoading(false);
        return;
      }

      const res = await api.get(`/results/groups/${groupId}/results`, {
        params: { page: pagination.page, per_page: pagination.per_page, search: searchTerm }
      });
      const rows = (res.data?.results || []).map(r => ({
        ...r,
        // compute grade from percentage
        __grade: r.percentage >= 90 ? 'A' : r.percentage >= 80 ? 'B' : r.percentage >= 70 ? 'C' : r.percentage >= 60 ? 'D' : 'F'
      }));
      // client-side grade filter (backend doesn't filter by grade yet)
      const filtered = gradeFilter === 'all' ? rows : rows.filter(r => r.__grade === gradeFilter);
      setResults(filtered);
      if (res.data?.pagination) {
        const p = res.data.pagination;
        setPagination({
          page: p.page || 1,
          per_page: p.per_page || 10,
          total: p.total || filtered.length,
          total_pages: p.total ? Math.ceil(p.total / (p.per_page || 10)) : Math.ceil(filtered.length / (p.per_page || 10))
        });
      }
      setStats(res.data?.stats || {});
    } catch (err) {
      console.error('Failed to load results', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!groupId) return;
    try {
      const response = await api.get(`/results/groups/${groupId}/export.csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${group?.name || 'group'}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const formatUnix = (unix) => {
    if (!unix) return '';
    const d = new Date(unix * 1000);
    return d.toLocaleString();
  };

  const gradeBadge = (pct) => {
    const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
    const gradeColors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColors[grade]}`}>{grade} ({Math.round(pct)}%)</span>
    );
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (inGroupMode) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setGroupsPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    if (inGroupMode) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setGroupsPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    if (inGroupMode) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setGroupsPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handlePageChange = (page, perPage = inGroupMode ? pagination.per_page : groupsPagination.per_page) => {
    if (inGroupMode) {
      setPagination(prev => ({ ...prev, page, per_page: perPage }));
    } else {
      setGroupsPagination(prev => ({ ...prev, page, per_page: perPage }));
    }
  };

  const groupAvailableFilters = [
    {
      key: 'has_math',
      label: 'Has Math',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
  ];

  const resultAvailableFilters = [
    {
      key: 'grade',
      label: 'Grade',
      type: 'select',
      options: [
        { value: 'A', label: 'A (90%+)' },
        { value: 'B', label: 'B (80%+)' },
        { value: 'C', label: 'C (70%+)' },
        { value: 'D', label: 'D (60%+)' },
        { value: 'F', label: 'F (<60%)' }
      ]
    },
    {
      key: 'score_min',
      label: 'Min Score',
      type: 'number'
    },
    {
      key: 'score_max',
      label: 'Max Score',
      type: 'number'
    }
  ];

  const groupColumns = useMemo(() => ([
    {
      key: 'name',
      title: 'Group',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">
              {row.has_math && <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Math</span>}
            </div>
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
      key: 'scheme_count',
      title: 'Schemes',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value || 0}</span>
      )
    }
  ]), []);

  const resultColumns = useMemo(() => ([
    {
      key: 'index_number',
      title: 'Index Number',
      sortable: true,
    },
    {
      key: 'total_awarded',
      title: 'Score',
      render: (v, row) => (
        <div className="text-sm">
          <div className="font-medium">{v} / {row.total_max}</div>
          <div className="text-gray-500">{row.total_max > 0 ? Math.round((v / row.total_max) * 100) : 0}%</div>
        </div>
      )
    },
    {
      key: 'percentage',
      title: 'Grade',
      render: (v) => gradeBadge(v)
    },
    {
      key: 'updated_at_unix',
      title: 'Updated',
      render: (v) => <span className="text-sm text-gray-500">{formatUnix(v)}</span>
    }
  ]), [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && (!inGroupMode ? groups.length === 0 : results.length === 0)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center">
              <button
                onClick={() => navigate(inGroupMode ? '/results' : '/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {inGroupMode ? `Results – ${group?.name || ''}` : 'Results by Group'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {inGroupMode ? 'View candidate performance and export results' : 'Select a group to explore results'}
                </p>
              </div>
            </div>
            {inGroupMode && (
              <div className="flex items-center gap-3">
                <button onClick={handleExportCSV} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />
        )}

        {!inGroupMode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <EnhancedDataTable
              data={groups}
              columns={groupColumns}
              loading={loading}
              pagination={groupsPagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              onSearch={handleSearch}
              onFilter={handleFilter}
              sortField={sortField}
              sortDirection={sortDirection}
              searchTerm={searchTerm}
              filters={filters}
              availableFilters={groupAvailableFilters}
              title="Results by Group"
              subtitle="Select a group to view detailed results"
              showSearch={true}
              showFilters={true}
              showPagination={true}
              showPerPageSelector={true}
              emptyStateIcon="📊"
              emptyStateMessage="No groups with results found. Upload and mark some scripts first."
              onRowClick={(row) => navigate(`/results/group/${row.id}`)}
            />
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
            >
              <StatsCard title="Average Score" value={`${Math.round(stats.average_score || 0)}%`} icon={BarChart3} iconColor="blue" />
              <StatsCard title="Pass Rate" value={`${Math.round(stats.pass_rate || 0)}%`} icon={BarChart3} iconColor="green" />
              <StatsCard title="Highest Score" value={`${Math.round(stats.highest_score || 0)}%`} icon={BarChart3} iconColor="yellow" />
              <StatsCard title="Completed" value={`${stats.completed_candidates || 0}/${stats.total_candidates || 0}`} icon={BarChart3} iconColor="purple" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EnhancedDataTable
                data={results}
                columns={resultColumns}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSort={handleSort}
                onSearch={handleSearch}
                onFilter={handleFilter}
                sortField={sortField}
                sortDirection={sortDirection}
                searchTerm={searchTerm}
                filters={{ ...filters, grade: gradeFilter !== 'all' ? gradeFilter : undefined }}
                availableFilters={resultAvailableFilters}
                title={`Results - ${group?.name || ''}`}
                subtitle="Candidate performance and detailed scores"
                showSearch={true}
                showFilters={true}
                showPagination={true}
                showPerPageSelector={true}
                emptyStateIcon="📝"
                emptyStateMessage="No results found for this group. Mark some scripts to see results here."
                onRowClick={(row) => navigate(`/results/candidates/${row.candidate_id}`)}
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
