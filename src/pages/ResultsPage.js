import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Eye, BarChart3, ArrowLeft, Filter, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
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
  }, [groupId, groupsPagination.page, pagination.page, searchTerm, gradeFilter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
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

  const groupColumns = useMemo(() => ([
    {
      key: 'name',
      title: 'Group',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.has_math && (<span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Math</span>)}
        </div>
      )
    },
    {
      key: 'upload_count',
      title: 'Uploads',
    },
    {
      key: 'scheme_count',
      title: 'Schemes',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/results/group/${row.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm">View Results</Link>
        </div>
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
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/results/candidates/${row.candidate_id}`)} className="text-indigo-600 hover:text-indigo-900" title="View candidate">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
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
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Groups</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by group name..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setSearchTerm(''); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            <DataTable
              data={groups}
              columns={groupColumns}
              loading={loading}
              pagination={groupsPagination}
              onPageChange={(page) => setGroupsPagination(prev => ({ ...prev, page }))}
            />
          </>
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Candidates</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by index number..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Grade</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => { setGradeFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="A">A (90%+)</option>
                    <option value="B">B (80%+)</option>
                    <option value="C">C (70%+)</option>
                    <option value="D">D (60%+)</option>
                    <option value="F">F (&lt;60%)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setSearchTerm(''); setGradeFilter('all'); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            <DataTable
              data={results}
              columns={resultColumns}
              loading={loading}
              pagination={pagination}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </>
        )}
      </div>
    </div>
  );
}
