import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Circle, Loader2, Upload, AlertTriangle, RefreshCw, ChevronRight, BarChart3 } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import api from '../api/axios';
import { Link } from 'react-router-dom';

export default function MarkingGroupsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // backend route: GET /marking-groups/progress
      const res = await api.get('/marking-groups/progress');
      const data = res.data?.groups || res.data?.data?.groups || [];
      setRows(data);
    } catch (err) {
      console.error('Failed to load marking groups:', err);
      setError('Failed to load marking groups');
    } finally {
      setLoading(false);
    }
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

  const statusPill = (st) => {
    const map = {
      idle: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    const icon = st === 'completed' ? <CheckCircle className="w-4 h-4 mr-1"/> : st === 'processing' ? <Loader2 className="w-4 h-4 mr-1 animate-spin"/> : <Circle className="w-4 h-4 mr-1"/>;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[st] || map.idle}`}>{icon}{st||'idle'}</span>;
  };

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
              <RefreshCw className="w-4 h-4"/> Refresh
            </button>
            <button disabled={selectedIds.length===0 || bulkBusy} onClick={() => startGroups(selectedIds)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              <Play className="w-4 h-4"/> Start Selected ({selectedIds.length})
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4"/>}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <input type="checkbox" onChange={(e)=>toggleAll(e.target.checked)} checked={rows.length>0 && selectedIds.length===rows.length} />
              <span className="text-gray-600">Select all</span>
            </div>
            <div className="text-gray-500">{rows.length} groups</div>
          </div>
          <div className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-gray-400"/>
                </div>
                <p>No groups yet</p>
              </div>
            ) : rows.map((g, idx) => (
              <motion.div key={g.group_id || idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx*0.02 }} className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!selected[g.group_id]} onChange={()=>toggleOne(g.group_id)} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{g.group_name}</span>
                      {statusPill(g.status)}
                      <span className="text-xs text-gray-500">Uploads: {g.uploads}</span>
                      <span className="text-xs text-gray-500">Scripts: {g.scripts_marked || 0}/{g.scripts_total || 0}</span>
                      <span className="text-xs text-gray-400">OCR pages: {g.pages_done}/{g.pages_total}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button onClick={() => startGroups([g.group_id])} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"><Play className="w-3.5 h-3.5"/> Start</button>
                      <Link to={`/uploads/group/${g.group_id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"><Upload className="w-3.5 h-3.5"/> Uploads <ChevronRight className="w-3 h-3"/></Link>
                      <Link to={`/anomalies/${g.group_id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"><AlertTriangle className="w-3.5 h-3.5 text-amber-600"/> Anomalies <ChevronRight className="w-3 h-3"/></Link>
                      <Link to={`/results/group/${g.group_id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50"><BarChart3 className="w-3.5 h-3.5 text-indigo-600"/> Results <ChevronRight className="w-3 h-3"/></Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
