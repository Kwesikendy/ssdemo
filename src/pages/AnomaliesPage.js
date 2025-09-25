import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Filter, RefreshCw, AlertTriangle, Save } from 'lucide-react';
import DataTable from '../components/DataTable';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function AnomaliesPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Group list
  const [groups, setGroups] = useState([]);
  const [groupsPagination, setGroupsPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });

  // Group detail anomalies
  const [anomalies, setAnomalies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });
  const [selected, setSelected] = useState(null); // currently viewed anomaly item
  const [ocrDraft, setOcrDraft] = useState('');

  const inGroupMode = !!groupId;

  useEffect(() => {
    setError(null);
    if (!inGroupMode) {
      loadGroups();
    } else {
      loadGroupAnomalies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, severity, groupsPagination.page, pagination.page, searchTerm]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/anomalies/groups');
      let list = res.data?.groups || [];
      // Apply severity filter (client-side) for group summaries
      if (severity) {
        list = list.filter(g => (g[severity] || 0) > 0);
      }
      // Apply search by group name (client-side)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(g => (g.group_name || '').toLowerCase().includes(q));
      }
      const total = list.length;
      const start = (groupsPagination.page - 1) * groupsPagination.per_page;
      setGroups(list.slice(start, start + groupsPagination.per_page));
      setGroupsPagination(prev => ({ ...prev, total, total_pages: Math.ceil(total / prev.per_page) }));
    } catch (err) {
      console.error('Failed to load anomaly groups', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/anomalies/groups/${groupId}`, { params: { page: pagination.page, per_page: pagination.per_page, severity, search: searchTerm } });
      const all = res.data?.anomalies || [];
      // Client-side filter by search across common fields
      const filtered = !searchTerm ? all : all.filter(a => {
        const q = searchTerm.toLowerCase();
        return (
          (a.index_number || '').toLowerCase().includes(q) ||
          (a.anomaly_type || '').toLowerCase().includes(q) ||
          (a.ocr_text || '').toLowerCase().includes(q)
        );
      });
      const start = (pagination.page - 1) * pagination.per_page;
      const pageItems = filtered.slice(start, start + pagination.per_page);
      setAnomalies(pageItems);
      setPagination(prev => ({ ...prev, total: filtered.length, total_pages: Math.ceil(filtered.length / prev.per_page) }));
    } catch (err) {
      console.error('Failed to load anomalies', err);
      setError('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  const redoOCR = async (pageId) => {
    try {
      await api.post(`/pages/${pageId}/ocr/redo`);
      await loadGroupAnomalies();
    } catch (err) {
      setError('Failed to redo OCR');
    }
  };

  const saveOCR = async (pageId) => {
    try {
      await api.patch(`/pages/${pageId}/ocr`, { ocr_text: ocrDraft });
  await api.post(`/anomalies/pages/${pageId}/remark`);
      await loadGroupAnomalies();
      setSelected(null);
    } catch (err) {
  setError('Failed to save & resubmit for remarking');
    }
  };

  const severityBadge = (sev) => {
    const map = { low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-orange-100 text-orange-800', critical: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[sev] || 'bg-gray-100 text-gray-600'}`}>{sev || 'unknown'}</span>;
  };

  const groupColumns = [
    { key: 'group_name', title: 'Group' },
    { key: 'total', title: 'Total' },
  { key: 'low', title: 'Low' },
  { key: 'medium', title: 'Medium' },
    { key: 'high', title: 'High' },
    { key: 'critical', title: 'Critical' },
    { key: 'actions', title: 'Actions', render: (v, row) => (
      <div className="flex gap-2">
        <button className="text-indigo-600 hover:underline" onClick={() => navigate(`/anomalies/${row.group_id}`)}>View</button>
        <Link className="text-gray-600 hover:underline" to={`/results/group/${row.group_id}`}>Results</Link>
      </div>
    ) }
  ];

  const anomalyColumns = [
    { key: 'severity', title: 'Severity', render: (v) => severityBadge(v) },
    { key: 'anomaly_type', title: 'Type' },
    { key: 'index_number', title: 'Candidate', render: (v) => v || '-' },
    { key: 'page_id', title: 'Page', render: (v, row) => (
      row.blob_url ? <a href={row.blob_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Image</a> : '-'
    ) },
    { key: 'actions', title: 'Actions', render: (v, row) => (
      <div className="flex gap-2">
        <button className="text-indigo-600 hover:underline" onClick={() => { setSelected(row); setOcrDraft(row.ocr_text || ''); }}>View</button>
        {row.page_id && <button className="text-gray-700 hover:underline" onClick={() => redoOCR(row.page_id)}>Redo OCR</button>}
        {row.candidate_id && <Link className="text-gray-600 hover:underline" to={`/results/candidates/${row.candidate_id}`}>Results</Link>}
      </div>
    ) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {inGroupMode && (
              <button onClick={() => navigate('/anomalies')} className="mr-3 text-gray-500 hover:text-gray-700">← Back</button>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{inGroupMode ? 'Group Anomalies' : 'Anomalies by Group'}</h1>
              <p className="text-sm text-gray-600">Investigate and fix OCR/marking issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 bg-white">
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder={inGroupMode ? 'Search by candidate, type, or OCR text...' : 'Search groups...'}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); inGroupMode ? setPagination(p=>({ ...p, page: 1 })) : setGroupsPagination(p=>({ ...p, page: 1 })); }}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white"
              />
            </div>
            <button onClick={() => (inGroupMode ? loadGroupAnomalies() : loadGroups())} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}

        {!inGroupMode ? (
          <DataTable data={groups} columns={groupColumns} loading={loading} pagination={groupsPagination} onPageChange={(page) => setGroupsPagination(prev => ({ ...prev, page }))} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DataTable data={anomalies} columns={anomalyColumns} loading={loading} pagination={pagination} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
            </div>
            <div className="lg:col-span-2">
              {!selected ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-500">Select a script to view image and OCR text</div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">{selected.anomaly_type}</span>
                      {severityBadge(selected.severity)}
                    </div>
                    <div className="text-xs text-gray-500">{selected.created_at}</div>
                  </div>
                  <div className="space-y-3">
                    {selected.blob_url && (
                      <div>
                        <div className="text-xs mb-1 text-gray-500">Page Image</div>
                        <a href={selected.blob_url} target="_blank" rel="noreferrer"><img alt="page" src={selected.blob_url} className="w-full rounded border" /></a>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-gray-500">OCR Text</div>
                        {selected.page_id && <button onClick={() => redoOCR(selected.page_id)} className="text-xs text-gray-600 hover:underline">Regenerate OCR</button>}
                      </div>
                      <textarea value={ocrDraft} onChange={(e) => setOcrDraft(e.target.value)} className="w-full h-48 border rounded p-2 text-sm" placeholder="Edit OCR text..."></textarea>
                      {selected.page_id && (
                        <div className="mt-2 flex justify-end">
                          <button onClick={() => saveOCR(selected.page_id)} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">Save & Resubmit</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
