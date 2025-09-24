import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Users, Plus, Edit, Trash2 } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import Modal from '../components/Modal';
import api from '../api/axios';

const ExamGroupsPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // const { user } = useAuth();
  const { success, error } = useToast();
  
  // const [exam, setExam] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [errorState, setErrorState] = useState(null);
  const [formModal, setFormModal] = useState({ 
    open: false, 
    mode: 'create', 
    group: null, 
    name: '', 
    description: '', 
    has_math: false, 
    group_type: 'simple' 
  });

  const examName = location.state?.examName || 'Exam';

  const fetchExamDetails = useCallback(async () => {
    try {
      // const response = await api.get(`/exams/${examId}`);
      // setExam(response.data);
    } catch (err) {
      console.error('Failed to fetch exam details:', err);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      // setErrorState(null);
      
      const response = await api.get(`/exams/${examId}/groups`);
      setGroups(response.data.groups || []);
      
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      // setErrorState('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExamDetails();
    fetchGroups();
  }, [examId, fetchExamDetails, fetchGroups]);

  const handleOpenCreate = () => {
    setFormModal({ 
      open: true, 
      mode: 'create', 
      group: null, 
      name: '', 
      description: '', 
      has_math: false, 
      group_type: 'simple' 
    });
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    
    try {
      const groupData = {
        name: formModal.name,
        description: formModal.description,
        has_math: formModal.has_math,
        group_type: formModal.group_type
      };

      if (formModal.mode === 'create') {
        // Create group in the current exam
        const response = await api.post('/groups', groupData);
        const newGroupId = response.data.id;
        
        // Move the group to the current exam
        await api.put(`/exams/${examId}/groups/${newGroupId}`);
        success('Group created successfully');
      } else {
        await api.put(`/groups/${formModal.group.id}`, groupData);
        success('Group updated successfully');
      }

      setFormModal({ 
        open: false, 
        mode: 'create', 
        group: null, 
        name: '', 
        description: '', 
        has_math: false, 
        group_type: 'simple' 
      });
      
      await fetchGroups();
      
    } catch (err) {
      console.error('Failed to save group:', err);
      error('Failed to save group');
    }
  };

  const handleDeleteGroup = async (group) => {
    try {
      await api.delete(`/groups/${group.id}`);
      success('Group deleted successfully');
      await fetchGroups();
    } catch (err) {
      console.error('Failed to delete group:', err);
      error('Failed to delete group');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/groups')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {examName}
              </h1>
              <p className="mt-2 text-gray-600">
                Groups in this exam ({groups.length} total)
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {groups.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {groups.map(group => (
                <div key={group.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        group.group_type === 'batch' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {group.group_type === 'batch' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.description || 'No description'}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            group.group_type === 'simple' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {group.group_type === 'simple' ? 'Individual Scripts' : 'Batch Uploads'}
                          </span>
                          {group.has_math && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Math Content
                            </span>
                          )}
                          <span>Created {formatDate(group.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/uploads/group/${group.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View Uploads
                      </button>
                      <button
                        onClick={() => setFormModal({ 
                          open: true, 
                          mode: 'edit', 
                          group, 
                          name: group.name, 
                          description: group.description || '', 
                          has_math: group.has_math, 
                          group_type: group.group_type 
                        })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
        </div>
      </div>

      {/* Group Form Modal */}
      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ 
          open: false, 
          mode: 'create', 
          group: null, 
          name: '', 
          description: '', 
          has_math: false, 
          group_type: 'simple' 
        })}
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
            <select
              value={formModal.group_type}
              onChange={(e) => setFormModal(prev => ({ ...prev, group_type: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="simple">Individual Scripts</option>
              <option value="batch">Batch Uploads</option>
            </select>
          </div>
          <div className="flex items-center opacity-50 cursor-not-allowed">
            <input
              id="has_math"
              type="checkbox"
              checked={formModal.has_math}
              onChange={(e) => setFormModal(prev => ({ ...prev, has_math: e.target.checked }))}
              disabled
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="has_math" className="ml-2 block text-sm text-gray-700">
              This group contains mathematics content <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setFormModal({ 
                open: false, 
                mode: 'create', 
                group: null, 
                name: '', 
                description: '', 
                has_math: false, 
                group_type: 'simple' 
              })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {formModal.mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamGroupsPage;
