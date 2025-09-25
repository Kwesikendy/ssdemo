import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export const useBatchOperations = (groupId) => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const [deletingBatch, setDeletingBatch] = useState(null);

  const handleViewBatch = (batchName) => {
    navigate(`/uploads/group/${groupId}/batch/${encodeURIComponent(batchName)}`);
  };

  const handleDeleteBatch = async (batchName) => {
    if (!window.confirm('Delete this batch? This will remove all images in this batch.')) return;
    
    try {
      setDeletingBatch(batchName);
      info('Deleting batch...');
      
      await api.delete(`/exams/${groupId}/batches/${encodeURIComponent(batchName)}`);
      success('Batch deleted successfully');
      
      return true; // Success
    } catch (err) {
      console.error('Delete batch failed', err);
      const errorMsg = 'Failed to delete batch.';
      error(errorMsg);
      return false; // Failure
    } finally {
      setDeletingBatch(null);
    }
  };

  const handleGoToMarkBatch = (batchName) => {
    // TODO: Navigate to marking page for this batch
    info('Marking functionality coming soon');
  };

  return {
    deletingBatch,
    handleViewBatch,
    handleDeleteBatch,
    handleGoToMarkBatch,
  };
};

export default useBatchOperations;
