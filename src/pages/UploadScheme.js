import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Image, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import api from '../api/axios';
import Select from 'react-select';

export default function UploadScheme() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    upload_type: 'text',
    scheme_text: '',
    custom_instructions: '',
    has_math: false,
    group_ids: [],
    questions: {}
  });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups', { params: { per_page: 100 } });
      const data = response.data?.groups || response.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch groups error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setUploadFile(file);
        setError(null);
      } else {
        setError('Please select an image file (PNG, JPG, JPEG) or PDF file.');
        e.target.value = '';
      }
    }
  };

  const processImageWithOCR = async (file) => {
    return `[OCR processing of ${file.name} would happen here. This is a placeholder for the extracted text from the image.]`;
  };

  const testConnection = async () => {
    try {
      const response = await api.get('/groups');
      console.log('Groups API response:', response.data);
      setError(null);
      setSuccess('API connection successful!');
    } catch (err) {
      console.error('Connection test error:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError(`Connection test failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Scheme name is required.');
      return;
    }

    if (formData.group_ids.length === 0) {
      setError('Please select at least one group.');
      return;
    }

    if (formData.upload_type === 'text' && !formData.scheme_text.trim()) {
      setError('Scheme text is required when uploading as text.');
      return;
    }

    if (formData.upload_type === 'image' && !uploadFile) {
      setError('Please select an image file when uploading as image.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let schemeText = formData.scheme_text;
      if (formData.upload_type === 'image' && uploadFile) {
        schemeText = await processImageWithOCR(uploadFile);
      }

      const payload = {
        name: formData.name.trim(),
        scheme_text: schemeText,
        custom_instructions: formData.custom_instructions.trim(),
        has_math: formData.has_math,
        group_ids: formData.group_ids,
        questions: {
          ...(formData.questions || {}),
          origin: formData.upload_type === 'image' ? 'image' : 'text',
        },
      };

      await api.post('/marking-schemes', payload);

      setSuccess('Marking scheme uploaded successfully!');
      setFormData({
        name: '',
        upload_type: 'text',
        scheme_text: '',
        custom_instructions: '',
        has_math: false,
        group_ids: [],
        questions: {},
      });
      setUploadFile(null);

      setTimeout(() => {
        navigate('/schemes');
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to upload marking scheme. Please try again.';
      if (err.response) {
        if (err.response.data?.error?.message) {
          errorMessage = err.response.data.error.message;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = "Access denied. You don't have permission to upload schemes.";
        } else if (err.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the backend configuration.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center mb-4"
          >
            <button
              onClick={() => navigate('/schemes')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Upload Marking Scheme</h1>
          </motion.div>
          <p className="text-gray-600">Create a new marking scheme by uploading text or image content</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-6" />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Scheme Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter marking scheme name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-lg border-2 p-4 flex items-center justify-center transition-colors ${formData.upload_type === 'text' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input
                    type="radio"
                    name="upload_type"
                    value="text"
                    checked={formData.upload_type === 'text'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <span className="text-sm font-medium">Text Input</span>
                    <p className="text-xs text-gray-500 mt-1">Type or paste scheme content</p>
                  </div>
                </label>

                <label className={`cursor-pointer rounded-lg border-2 p-4 flex items-center justify-center transition-colors ${formData.upload_type === 'image' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input
                    type="radio"
                    name="upload_type"
                    value="image"
                    checked={formData.upload_type === 'image'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <span className="text-sm font-medium">Image Upload</span>
                    <p className="text-xs text-gray-500 mt-1">Upload image with OCR</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="custom_instructions" className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions for LLM</label>
              <textarea
                id="custom_instructions"
                name="custom_instructions"
                value={formData.custom_instructions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter any additional instructions for the AI when marking papers (optional)..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">These instructions will guide the AI when marking papers using this scheme</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_math"
                name="has_math"
                checked={formData.has_math}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="has_math" className="ml-2 block text-sm text-gray-700">This scheme contains mathematical content</label>
            </div>

            {formData.upload_type === 'text' && (
              <div>
                <label htmlFor="scheme_text" className="block text-sm font-medium text-gray-700 mb-2">Scheme Content *</label>
                <textarea
                  id="scheme_text"
                  name="scheme_text"
                  value={formData.scheme_text}
                  onChange={handleInputChange}
                  rows={12}
                  placeholder="Enter your marking scheme content here..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  required
                />
              </div>
            )}

            {formData.upload_type === 'image' && (
              <div>
                <label htmlFor="image_upload" className="block text-sm font-medium text-gray-700 mb-2">Upload Image *</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="image_upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Upload a file</span>
                        <input id="image_upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF up to 10MB</p>
                    {uploadFile && (<p className="text-sm text-green-600 mt-2">Selected: {uploadFile.name}</p>)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Groups *</label>
              <Select
                isMulti
                options={groups.map((g) => ({ value: g.id, label: g.name }))}
                value={groups.filter((g) => formData.group_ids.includes(g.id)).map((g) => ({ value: g.id, label: g.name }))}
                onChange={(vals) => {
                  const ids = (vals || []).map((v) => v.value);
                  setFormData((prev) => ({ ...prev, group_ids: ids }));
                }}
                classNamePrefix="react-select"
              />
              {formData.group_ids.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">{formData.group_ids.length} group(s) selected</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={testConnection}
                className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Connection
              </button>
              <button
                type="button"
                onClick={() => navigate('/schemes')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Uploading...' : 'Upload Scheme'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
