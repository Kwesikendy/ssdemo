import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Download, 
  Eye, 
  Filter, 
  Search, 
  ChevronRight,
  Calendar,
  Award,
  BarChart3,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  
  // State management
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      const response = await api.get('/results-enhanced/overview');
      setOverview(response.data);
      setGroups(response.data.groups || []);
    } catch (err) {
      console.error('Failed to fetch results overview:', err);
      setError('Failed to load results overview');
      showError('Failed to load results overview');
    }
  }, [showError]);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await fetchOverview();
      setLoading(false);
    };
    loadData();
  }, [fetchOverview]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
    showSuccess('Results refreshed successfully');
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Navigate to group results
  const handleViewGroupResults = (groupId) => {
    navigate(`/results/group/${groupId}`);
  };

  // Navigate to candidate detail
  const handleViewCandidate = (candidateId) => {
    navigate(`/results/candidate/${candidateId}`);
  };

  // Export group results
  const handleExportGroup = async (groupId, format = 'csv') => {
    try {
      const response = await api.get(`/results-enhanced/group/${groupId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `group-results.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Group results exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      showError('Failed to export group results');
    }
  };

  // Filter and sort groups
  const filteredGroups = groups
    .filter(group => {
      const matchesSearch = group.group_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'marked' && group.marked_candidates > 0) ||
        (filterStatus === 'unmarked' && group.marked_candidates === 0);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.group_name.localeCompare(b.group_name);
        case 'candidates':
          return b.total_candidates - a.total_candidates;
        case 'marked':
          return b.marked_candidates - a.marked_candidates;
        case 'average':
          return b.average_score - a.average_score;
        default:
          return 0;
      }
    });

  // Get status color
  const getStatusColor = (group) => {
    if (group.marked_candidates === 0) return 'text-gray-500';
    if (group.marked_candidates === group.total_candidates) return 'text-green-600';
    return 'text-yellow-600';
  };

  // Get status icon
  const getStatusIcon = (group) => {
    if (group.marked_candidates === 0) return <Clock className="h-4 w-4" />;
    if (group.marked_candidates === group.total_candidates) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  // Get group type color
  const getGroupTypeColor = (groupType) => {
    switch (groupType) {
      case 'simple': return 'bg-blue-100 text-blue-800';
      case 'batch': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="h-7 w-7 text-yellow-500" />
                Results Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                View and analyze marking results across all groups
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Stats */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.total_groups}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.total_candidates}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Marked Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.marked_candidates}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overview.average_score ? overview.average_score.toFixed(1) : '0.0'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Groups</option>
                <option value="marked">Marked Only</option>
                <option value="unmarked">Unmarked Only</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="candidates">Sort by Candidates</option>
                <option value="marked">Sort by Marked</option>
                <option value="average">Sort by Average Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleGroupExpansion(group.group_id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight 
                            className={`h-4 w-4 text-gray-500 transition-transform ${
                              expandedGroups.has(group.group_id) ? 'rotate-90' : ''
                            }`} 
                          />
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {group.group_name}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGroupTypeColor(group.exam_type)}`}>
                              {group.exam_type}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.total_candidates} candidates • {group.marked_candidates} marked
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          {getStatusIcon(group)}
                          <span className={`font-medium ${getStatusColor(group)}`}>
                            {group.marked_candidates === 0 ? 'Not Started' :
                             group.marked_candidates === group.total_candidates ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        {group.average_score > 0 && (
                          <p className="text-sm text-gray-600">
                            Avg: {group.average_score.toFixed(1)}/{group.total_max_score}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewGroupResults(group.group_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Results
                        </button>
                        <button
                          onClick={() => handleExportGroup(group.group_id)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {group.total_candidates > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((group.marked_candidates / group.total_candidates) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(group.marked_candidates / group.total_candidates) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedGroups.has(group.group_id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t bg-gray-50"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Candidates:</span>
                                <span className="font-medium">{group.total_candidates}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Marked:</span>
                                <span className="font-medium text-green-600">{group.marked_candidates}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Average Score:</span>
                                <span className="font-medium">{group.average_score.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Highest Score:</span>
                                <span className="font-medium">{group.highest_score}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Lowest Score:</span>
                                <span className="font-medium">{group.lowest_score}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Marking Schemes</h4>
                            <div className="space-y-1">
                              {group.marking_schemes && group.marking_schemes.length > 0 ? (
                                group.marking_schemes.map((scheme, idx) => (
                                  <div key={idx} className="text-sm text-gray-600">
                                    {scheme.name}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500">No schemes assigned</div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Last Activity</h4>
                            <div className="text-sm text-gray-600">
                              {group.last_marked_at ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(group.last_marked_at).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-gray-500">No activity yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No groups have been created yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;