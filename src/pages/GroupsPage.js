import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileText, Users, FolderPlus, ChevronRight, Edit, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export default function GroupsPage() {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const { success, error } = useToast();
  const [hierarchy, setHierarchy] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState({});
  const [selectedExams, setSelectedExams] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, group: null });
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false, group_type: 'simple' });
  const [groupModal, setGroupModal] = useState({ open: false, examName: '' });
  const [editExamModal, setEditExamModal] = useState({ open: false, exam: null, name: '' });
  const [deleteExamModal, setDeleteExamModal] = useState({ open: false, exam: null, moveGroups: true });
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ open: false, items: [], moveGroups: true });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [pagination.page, pagination.per_page]);

  // Reset pagination when search term changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  // Filter data based on search term
  const getFilteredData = () => {
    if (!searchTerm.trim()) {
      return hierarchy;
    }

    const searchLower = searchTerm.toLowerCase();
    return hierarchy.map(exam => ({
      ...exam,
      groups: exam.groups?.filter(group => 
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      ) || []
    })).filter(exam => 
      exam.name.toLowerCase().includes(searchLower) ||
      exam.groups.length > 0
    );
  };

  // Get paginated data
  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const allItems = [];
    
    // Add groups from default exam
    const defaultExam = filteredData.find(exam => exam.is_default);
    if (defaultExam?.groups) {
      allItems.push(...defaultExam.groups.map(group => ({ ...group, type: 'group' })));
    }
    
    // Add custom exams
    const customExams = filteredData.filter(exam => !exam.is_default);
    allItems.push(...customExams.map(exam => ({ ...exam, type: 'exam' })));
    
    const startIndex = (pagination.page - 1) * pagination.per_page;
    const endIndex = startIndex + pagination.per_page;
    
    return allItems.slice(startIndex, endIndex);
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      
      // Fetch hierarchical structure instead of flat groups
      const response = await api.get('/exams/hierarchy');
      const hierarchyData = response.data.hierarchy || [];
      
      console.log('Fetched hierarchy data:', JSON.stringify(hierarchyData, null, 2));
      setHierarchy(hierarchyData);
      
      // Calculate total groups for pagination
      const totalGroups = hierarchyData.reduce((total, exam) => total + (exam.groups?.length || 0), 0);
      setPagination(prev => ({ ...prev, total: totalGroups }));
      
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setErrorState('Failed to load groups');
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

  // Get selected group IDs
  const getSelectedGroupIds = () => {
    return Object.keys(selectedGroups).filter(id => selectedGroups[id]);
  };

  // Handle group action - create custom exam from selected groups
  const handleGroupAction = () => {
    const selectedIds = getSelectedGroupIds();
    if (selectedIds.length < 2) {
      error('Please select at least 2 groups to group together');
      return;
    }
    setGroupModal({ open: true, examName: '' });
  };

  // Create custom exam and move selected groups
  const handleCreateGroup = async () => {
    if (!groupModal.examName.trim()) {
      error('Please enter an exam name');
      return;
    }

    try {
      const selectedIds = getSelectedGroupIds();
      
      // Create new exam
      const examResponse = await api.post('/exams', {
        name: groupModal.examName,
        subject: 'Custom Group',
        session: 'Custom Session',
        status: 'active'
      });

      const examId = examResponse.data.id;

      // Move selected groups to the new exam
      for (const groupId of selectedIds) {
        await api.put(`/exams/${examId}/groups/${groupId}`);
      }

      setGroupModal({ open: false, examName: '' });
      setSelectedGroups({});
      await fetchGroups();
      success(`Created exam "${groupModal.examName}" with ${selectedIds.length} groups`);
      
    } catch (err) {
      console.error('Failed to create group:', err);
      error('Failed to create exam group');
    }
  };

  // Navigate to exam groups page
  const handleViewExamGroups = (examId, examName) => {
    navigate(`/groups/exam/${examId}`, { state: { examName } });
  };

  const handleOpenCreate = () => {
    setFormModal({ open: true, mode: 'create', group: null, name: '', description: '', has_math: false, group_type: 'simple' });
  };

  const handleOpenEdit = (group) => {
    setFormModal({ open: true, mode: 'edit', group, name: group.name, description: group.description || '', has_math: !!group.has_math, group_type: group.group_type || 'simple' });
  };

  const handleDeleteGroup = async (group) => {
    try {
      await api.delete(`/groups/${group.id}`);
      setDeleteModal({ open: false, group: null });
      fetchGroups();
      setErrorState(null);
    } catch (err) {
      setErrorState('Failed to delete group. Please try again.');
      console.error('Delete group error:', err);
    }
  };

  // const handleViewGroup = (group) => {
  //   navigate(`/groups/${group.id}`);
  // };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    try {
  const payload = { name: formModal.name.trim(), description: formModal.description.trim(), has_math: !!formModal.has_math, group_type: formModal.group_type };
      if (!payload.name) {
        setErrorState('Group name is required.');
        return;
      }
      if (formModal.mode === 'create') {
        await api.post('/groups', payload);
      } else if (formModal.mode === 'edit' && formModal.group) {
        await api.put(`/groups/${formModal.group.id}`, payload);
      }
  setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false, group_type: 'simple' });
      await fetchGroups();
      await fetchStats();
      setErrorState(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save group.';
      setErrorState(msg);
      console.error('Save group error:', err);
    }
  };

  // const formatDate = (dateString) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric'
  //   });
  // };

  const handleEditExam = (exam) => {
    setEditExamModal({ open: true, exam, name: exam.name });
  };

  const handleDeleteExam = (exam) => {
    if (exam.is_default) {
      error('Cannot delete default exam');
      return;
    }
    
    setDeleteExamModal({ open: true, exam, moveGroups: true });
  };

  const handleConfirmDeleteExam = async () => {
    try {
      const { exam, moveGroups } = deleteExamModal;
      const url = moveGroups 
        ? `/exams/${exam.id}?move_groups=true`
        : `/exams/${exam.id}?move_groups=false`;
      
      await api.delete(url);
      
      const action = moveGroups ? 'moved to default exam' : 'deleted';
      success(`Exam deleted successfully. Groups were ${action}.`);
      
      setDeleteExamModal({ open: false, exam: null, moveGroups: true });
      await fetchGroups();
      await fetchStats();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete exam.';
      error(msg);
      console.error('Delete exam error:', err);
    }
  };

  const handleSubmitExamEdit = async (e) => {
    e.preventDefault();
    try {
      if (!editExamModal.name.trim()) {
        error('Exam name is required');
        return;
      }
      
      await api.put(`/exams/${editExamModal.exam.id}`, {
        name: editExamModal.name.trim()
      });
      
      setEditExamModal({ open: false, exam: null, name: '' });
      success('Exam updated successfully');
      await fetchGroups();
      await fetchStats();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update exam.';
      error(msg);
      console.error('Update exam error:', err);
    }
  };

  // Helper functions for bulk operations
  const getSelectedExamIds = () => {
    return Object.keys(selectedExams).filter(id => selectedExams[id]);
  };

  const getAllSelectedItems = () => {
    const groups = getSelectedGroupIds().map(id => ({ type: 'group', id }));
    const exams = getSelectedExamIds().map(id => ({ type: 'exam', id }));
    return [...groups, ...exams];
  };

  const handleBulkDelete = () => {
    const selectedItems = getAllSelectedItems();
    if (selectedItems.length === 0) return;
    
    setBulkDeleteModal({ 
      open: true, 
      items: selectedItems, 
      moveGroups: true 
    });
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const { items, moveGroups } = bulkDeleteModal;
      const groups = items.filter(item => item.type === 'group');
      const exams = items.filter(item => item.type === 'exam');

      // Delete groups
      for (const group of groups) {
        await api.delete(`/groups/${group.id}`);
      }

      // Delete exams
      for (const exam of exams) {
        const url = moveGroups 
          ? `/exams/${exam.id}?move_groups=true`
          : `/exams/${exam.id}?move_groups=false`;
        await api.delete(url);
      }

      const groupCount = groups.length;
      const examCount = exams.length;
      let message = '';
      
      if (groupCount > 0 && examCount > 0) {
        message = `Successfully deleted ${groupCount} group(s) and ${examCount} exam(s).`;
      } else if (groupCount > 0) {
        message = `Successfully deleted ${groupCount} group(s).`;
      } else if (examCount > 0) {
        const action = moveGroups ? 'moved to default exam' : 'deleted';
        message = `Successfully deleted ${examCount} exam(s). Groups were ${action}.`;
      }

      success(message);
      setBulkDeleteModal({ open: false, items: [], moveGroups: true });
      setSelectedGroups({});
      setSelectedExams({});
      await fetchGroups();
      await fetchStats();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete selected items.';
      error(msg);
      console.error('Bulk delete error:', err);
    }
  };

  const handleSelectAllGroups = (checked) => {
    const filteredData = getFilteredData();
    const defaultExam = filteredData.find(exam => exam.is_default);
    const groups = defaultExam?.groups || [];
    const newSelection = { ...selectedGroups };
    groups.forEach(group => {
      newSelection[group.id] = checked;
    });
    setSelectedGroups(newSelection);
  };

  const handleSelectAllExams = (checked) => {
    const filteredData = getFilteredData();
    const customExams = filteredData.filter(exam => !exam.is_default);
    const newSelection = { ...selectedExams };
    customExams.forEach(exam => {
      newSelection[exam.id] = checked;
    });
    setSelectedExams(newSelection);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && hierarchy.length === 0} />
      
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
        {errorState && (
          <Alert
            type="error"
            message={errorState}
            onClose={() => setErrorState(null)}
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

        {/* Bulk Actions */}
        {getAllSelectedItems().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderPlus className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-indigo-900">
                  {getAllSelectedItems().length} item{getAllSelectedItems().length > 1 ? 's' : ''} selected
                  {getSelectedGroupIds().length > 0 && ` (${getSelectedGroupIds().length} group${getSelectedGroupIds().length > 1 ? 's' : ''})`}
                  {getSelectedExamIds().length > 0 && ` (${getSelectedExamIds().length} exam${getSelectedExamIds().length > 1 ? 's' : ''})`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getSelectedGroupIds().length > 0 && (
                  <button
                    onClick={handleGroupAction}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Group Together
                  </button>
                )}
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}


        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
        >
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search groups and exams..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    success('Search cleared');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Groups Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Groups & Exams</h3>
              <div className="flex items-center space-x-4">
                {(() => {
                  const filteredData = getFilteredData();
                  const defaultExam = filteredData.find(exam => exam.is_default);
                  const groups = defaultExam?.groups || [];
                  return groups.length > 0 && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groups.length > 0 && groups.every(group => selectedGroups[group.id])}
                        onChange={(e) => handleSelectAllGroups(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Select all groups ({groups.length})
                      </label>
                    </div>
                  );
                })()}
                {(() => {
                  const filteredData = getFilteredData();
                  const customExams = filteredData.filter(exam => !exam.is_default);
                  return customExams.length > 0 && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customExams.length > 0 && customExams.every(exam => selectedExams[exam.id])}
                        onChange={(e) => handleSelectAllExams(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Select all exams ({customExams.length})
                      </label>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Groups List */}
          <div className="divide-y divide-gray-200">
            {/* Groups and Exams */}
            {getPaginatedData().map((item, index) => (
              item.type === 'group' ? (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedGroups[item.id] || false}
                        onChange={(e) => setSelectedGroups(prev => ({
                          ...prev,
                          [item.id]: e.target.checked
                        }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className={`h-8 w-8 rounded flex items-center justify-center ${
                        item.group_type === 'batch' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.group_type === 'batch' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          {item.group_type} • {item.upload_count || 0} uploads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.group_type === 'simple' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.group_type === 'simple' ? 'Individual' : 'Batch'}
                      </span>
                      <button
                        onClick={() => navigate(`/uploads/group/${item.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View Uploads
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                        title="Edit Group"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, group: item })}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="p-4 hover:bg-gray-50 border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedExams[item.id] || false}
                        onChange={(e) => setSelectedExams(prev => ({
                          ...prev,
                          [item.id]: e.target.checked
                        }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="h-8 w-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          {item.groups?.length || 0} groups
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewExamGroups(item.id, item.name)}
                        className="inline-flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View Groups
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                      {!item.is_default && (
                        <>
                          <button
                            onClick={() => handleEditExam(item)}
                            className="inline-flex items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900"
                            title="Edit exam"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(item)}
                            className="inline-flex items-center px-2 py-2 text-sm text-red-600 hover:text-red-900"
                            title="Delete exam"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Pagination */}
          {(() => {
            const filteredData = getFilteredData();
            const totalGroups = filteredData.reduce((total, exam) => total + (exam.groups?.length || 0), 0);
            const totalExams = filteredData.filter(exam => !exam.is_default).length;
            const totalItems = totalGroups + totalExams;
            const totalPages = Math.ceil(totalItems / pagination.per_page);
            
            
            if (totalItems === 0) return null;
            
            return (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, totalItems)} of {totalItems} results
                    {totalPages > 1 && ` (Page ${pagination.page} of ${totalPages})`}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                              className={`px-3 py-1 text-sm font-medium rounded-md ${
                                pagination.page === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                        disabled={pagination.page === totalPages}
                        className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Empty State */}
          {(() => {
            const filteredData = getFilteredData();
            const defaultExam = filteredData.find(exam => exam.is_default);
            const hasDefaultGroups = defaultExam?.groups?.length > 0;
            const hasCustomExams = filteredData.filter(exam => !exam.is_default).length > 0;
            return !hasDefaultGroups && !hasCustomExams;
          })() && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first group.</p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </button>
            </div>
          )}
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
  onClose={() => setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false, group_type: 'simple' })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
            <select
              value={formModal.group_type}
              onChange={(e) => setFormModal(prev => ({ ...prev, group_type: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="simple">Individual Scripts - Show each uploaded image separately</option>
              <option value="batch">Batch Uploads - Group multiple uploads together with custom naming</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formModal.group_type === 'simple' 
                ? 'Perfect for individual exam scripts where each image should be visible separately' 
                : 'Ideal for organizing multiple batches of uploads with custom names like "1st batch", "2nd batch"'
              }
            </p>  
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
          <div className="flex items-center opacity-50 cursor-not-allowed">
            <input
              id="has_math"
              type="checkbox"
              checked={!!formModal.has_math}
              onChange={(e) => setFormModal(prev => ({ ...prev, has_math: e.target.checked }))}
              disabled
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="has_math" className="ml-2 block text-sm text-gray-700">
              This group contains mathematics content <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
          </div>
          <div className="sm:flex sm:flex-row-reverse sm:space-x-3 sm:space-x-reverse pt-2">
            <button type="submit" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              {formModal.mode === 'create' ? 'Create' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setFormModal({ open: false, mode: 'create', group: null, name: '', description: '', has_math: false, group_type: 'simple' })} className="mt-3 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Group Modal */}
      <Modal
        isOpen={groupModal.open}
        onClose={() => setGroupModal({ open: false, examName: '' })}
        title="Group Selected Groups"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Group {getSelectedGroupIds().length} selected groups together by creating a custom exam.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Name
            </label>
            <input
              type="text"
              value={groupModal.examName}
              onChange={(e) => setGroupModal(prev => ({ ...prev, examName: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Math Finals 2025"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setGroupModal({ open: false, examName: '' })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Create Exam
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Exam Modal */}
      <Modal
        isOpen={editExamModal.open}
        onClose={() => setEditExamModal({ open: false, exam: null, name: '' })}
        title="Edit Exam"
      >
        <form onSubmit={handleSubmitExamEdit} className="space-y-4">
          <div>
            <label htmlFor="exam-name" className="block text-sm font-medium text-gray-700">
              Exam Name
            </label>
            <input
              type="text"
              id="exam-name"
              value={editExamModal.name}
              onChange={(e) => setEditExamModal({ ...editExamModal, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter exam name"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditExamModal({ open: false, exam: null, name: '' })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Update Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Exam Confirmation Modal */}
      <Modal
        isOpen={deleteExamModal.open}
        onClose={() => setDeleteExamModal({ open: false, exam: null, moveGroups: true })}
        title="Delete Exam"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Are you sure you want to delete "{deleteExamModal.exam?.name}"?
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This exam has {deleteExamModal.exam?.groups?.length || 0} groups. What would you like to do with them?</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="radio"
                name="groupAction"
                checked={deleteExamModal.moveGroups}
                onChange={() => setDeleteExamModal({ ...deleteExamModal, moveGroups: true })}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">Move groups to default exam</div>
                <div className="text-sm text-gray-500">Groups will be preserved and moved to the top hierarchy (default exam)</div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="groupAction"
                checked={!deleteExamModal.moveGroups}
                onChange={() => setDeleteExamModal({ ...deleteExamModal, moveGroups: false })}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">Delete all groups</div>
                <div className="text-sm text-red-500">All groups in this exam will be permanently deleted</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDeleteExamModal({ open: false, exam: null, moveGroups: true })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteExam}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Exam
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={bulkDeleteModal.open}
        onClose={() => setBulkDeleteModal({ open: false, items: [], moveGroups: true })}
        title="Delete Selected Items"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete the selected items? This action cannot be undone.
              </p>
              {(() => {
                const groups = bulkDeleteModal.items.filter(item => item.type === 'group');
                const exams = bulkDeleteModal.items.filter(item => item.type === 'exam');
                return (
                  <div className="text-left bg-gray-50 p-3 rounded-md">
                    {groups.length > 0 && (
                      <p className="text-sm text-gray-700 mb-1">
                        • {groups.length} group{groups.length > 1 ? 's' : ''} will be deleted
                      </p>
                    )}
                    {exams.length > 0 && (
                      <p className="text-sm text-gray-700 mb-1">
                        • {exams.length} exam{exams.length > 1 ? 's' : ''} will be deleted
                      </p>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const hasExams = bulkDeleteModal.items.some(item => item.type === 'exam');
                return hasExams && (
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkDeleteModal.moveGroups}
                        onChange={(e) => setBulkDeleteModal(prev => ({ ...prev, moveGroups: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Move groups to default exam before deleting
                      </span>
                    </label>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setBulkDeleteModal({ open: false, items: [], moveGroups: true })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
