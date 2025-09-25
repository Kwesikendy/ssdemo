import { useState } from 'react';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

export const useImageOperations = (onRefresh) => {
  const { success, error, info } = useToast();
  const [deletingImage, setDeletingImage] = useState(null);
  const [savingOCR, setSavingOCR] = useState(false);

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this image? This action cannot be undone.')) return;
    
    try {
      setDeletingImage(imageId);
      info('Deleting image...');
      
      await api.delete(`/scripts/${imageId}`);
      success('Image deleted successfully');
      
      if (onRefresh) {
        onRefresh();
      }
      
      return true; // Success
    } catch (err) {
      console.error('Failed to delete image', err);
      error('Failed to delete image');
      return false; // Failure
    } finally {
      setDeletingImage(null);
    }
  };

  const handleUpdateOCR = async (imageId, ocrText) => {
    try {
      setSavingOCR(true);
      
      await api.patch(`/pages/${imageId}/ocr`, {
        ocr_text: ocrText
      });
      
      success('OCR text updated successfully');
      
      if (onRefresh) {
        onRefresh();
      }
      
      return true; // Success
    } catch (err) {
      console.error('Failed to update OCR text', err);
      error('Failed to update OCR text');
      return false; // Failure
    } finally {
      setSavingOCR(false);
    }
  };

  return {
    deletingImage,
    savingOCR,
    handleDeleteImage,
    handleUpdateOCR,
  };
};

export default useImageOperations;
