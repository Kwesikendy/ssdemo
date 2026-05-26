import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import EnhancedDataTable from '../components/EnhancedDataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

const AnomaliesPage = () => {
  const navigate = useNavigate();
  const [anomalyGroups, setAnomalyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchAnomalyGroups();
  }, [pagination.page, pagination.per_page, searchTerm, filters, sortField, sortDirection]);

  const fetchAnomalyGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock Data Check
      if (localStorage.getItem('token') === 'mock-jwt-token') {
        const mockGroups = [
          {
            exam_id: 'mock-exam-1',
            exam_name: 'Mathematics Class 101',
            anomaly_count: 2,
            created_at: new Date().toISOString(),
            anomalies: [
              { severity: 'medium', status: 'open' },
              { severity: 'low', status: 'resolved' }
            ]
          }
        ];
        setAnomalyGroups(mockGroups);
        setPagination(prev => ({ ...prev, total: 1, total_pages: 1 }));
        setLoading(false);
        return;
      }

      // Use the configured axios instance (points to http://localhost:8080/api/v1)
      const { data } = await api.get('/anomalies/groups');

      // Normalise field names: backend uses group_id/group_name,
      // the UI expects exam_id/exam_name.
      const raw = data.data || [];
      const groups = raw.map(g => ({
        ...g,
        exam_id:   g.exam_id   ?? g.group_id   ?? '',
        exam_name: g.exam_name ?? g.group_name  ?? 'Unknown Group',
        anomalies: g.anomalies || [],
      }));

      setAnomalyGroups(groups);
      setPagination(prev => ({
        ...prev,
        total: groups.length,
        total_pages: Math.ceil(groups.length / prev.per_page)
      }));
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load anomalies';
      setError(msg);
      toast.error('Failed to load anomalies');
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

  const availableFilters = [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'investigating', label: 'Investigating' },
        { value: 'ignored', label: 'Ignored' }
      ]
    }
  ];

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
      key: 'exam_name',
      title: 'Exam Group',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">ID: {row.exam_id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'anomaly_count',
      title: 'Anomalies',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {value} {value === 1 ? 'anomaly' : 'anomalies'}
        </span>
      )
    },
    {
      key: 'severity_summary',
      title: 'Severity',
      sortable: false,
      render: (value, row) => {
        const severities = row.anomalies?.map(a => a.severity) || [];
        const highestSeverity = severities.includes('critical') ? 'critical' :
          severities.includes('high') ? 'high' :
            severities.includes('medium') ? 'medium' : 'low';
        return <SeverityBadge severity={highestSeverity} size="sm" />;
      }
    },
    {
      key: 'status_summary',
      title: 'Status',
      sortable: false,
      render: (value, row) => {
        const statuses = row.anomalies?.map(a => a.status) || [];
        const hasOpen = statuses.includes('open');
        const hasInvestigating = statuses.includes('investigating');
        const status = hasOpen ? 'open' : hasInvestigating ? 'investigating' : 'resolved';
        return <StatusBadge status={status} size="sm" />;
      }
    },
    {
      key: 'created_at',
      title: 'Detected',
      sortable: true,
      render: (value) => (
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleRetry(row.exam_id)}
            className="text-indigo-600 hover:text-indigo-900 text-xs font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-200"
          >
            Retry All
          </button>
        </div>
      )
    }
  ];

  const handleRetry = async (examId) => {
    // This logic is actually per-anomaly in the drill-down page usually, but maybe we can trigger a group retry?
    // The backend `RetryOCR` takes an `anomaly_id`. 
    // The `AnomaliesPage` (this one) lists *Groups* (Exams). 
    // To implement "Retry" here, we'd need to retry all anomalies in the group, OR just navigate to the details.
    // The user request was "Anomaly Resolution UI".
    // Let's check `ExamAnomaliesPage.js` - THAT is likely where the individual anomalies are listed.
    // This page is just the summary.
    // I should check `ExamAnomaliesPage.js`.
    navigate(`/anomalies/exam/${examId}`);
  };

  // Filter and paginate data
  const filteredData = useMemo(() => {
    let filtered = [...anomalyGroups];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.exam_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.severity) {
      filtered = filtered.filter(group =>
        group.anomalies?.some(a => a.severity === filters.severity)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(group =>
        group.anomalies?.some(a => a.status === filters.status)
      );
    }

    return filtered;
  }, [anomalyGroups, searchTerm, filters]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.per_page;
    const end = start + pagination.per_page;
    return filteredData.slice(start, end);
  }, [filteredData, pagination.page, pagination.per_page]);


  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Anomalies</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAnomalyGroups}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAnomalies = anomalyGroups.reduce((sum, group) => sum + (group.anomaly_count || 0), 0);
  const openAnomalies = anomalyGroups.reduce((sum, group) =>
    sum + (group.anomalies?.filter(a => a.status === 'open').length || 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:flex md:items-center md:justify-between mb-8"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 sm:truncate">
              Anomalies
            </h1>
            <p className="mt-2 text-gray-600">
              Review and resolve issues detected during OCR processing
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatsCard
            title="Total Anomalies"
            value={totalAnomalies}
            icon={AlertTriangle}
            iconColor="red"
          />
          <StatsCard
            title="Open Issues"
            value={openAnomalies}
            icon={Clock}
            iconColor="orange"
          />
          <StatsCard
            title="Exam Groups"
            value={anomalyGroups.length}
            icon={FileText}
            iconColor="blue"
          />
        </motion.div>

        {/* Enhanced Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <EnhancedDataTable
            data={paginatedData}
            columns={columns}
            loading={loading}
            pagination={{
              ...pagination,
              total: filteredData.length,
              total_pages: Math.ceil(filteredData.length / pagination.per_page)
            }}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            onFilter={handleFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            searchTerm={searchTerm}
            filters={filters}
            availableFilters={availableFilters}
            title="Anomaly Groups"
            subtitle="Groups with detected anomalies that need attention"
            showSearch={true}
            showFilters={true}
            showPagination={true}
            showPerPageSelector={true}
            emptyStateIcon="✅"
            emptyStateMessage="No anomalies found. All exams are processing correctly!"

            onRefresh={fetchAnomalyGroups}
            onRowClick={(row) => navigate(`/anomalies/exam/${row.exam_id}`)}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AnomaliesPage;