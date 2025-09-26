import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { useToast } from '../components/ToastProvider';

export default function UploadDetailPage(){
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [upload, setUpload] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, [uploadId]);

  async function fetchData(){
    try{
      setLoading(true);
      console.log('Fetching upload data for ID:', uploadId);
      const ures = await api.get(`/uploads/${uploadId}`);
      const ubody = ures.data;
      setUpload(ubody.data || ubody);
      console.log('Upload data:', ubody.data || ubody);
      
      console.log('Fetching pages for upload ID:', uploadId);
      const pres = await api.get(`/uploads/${uploadId}/pages`, { params: { page: 1, per_page: 100 } });
      const pbody = pres.data;
      console.log('Pages API response:', pbody);
      // Handle both cases: when pages is null or when it's an empty array
      const pagesData = pbody.data?.pages || pbody.pages;
      const rows = pagesData === null ? [] : (pagesData || []);
      console.log('Pages rows:', rows);
      setPages(rows);
      setError(null);
    }catch(e){
      console.error('Failed to fetch upload detail', e);
      const errorMsg = 'Failed to load upload details.';
      setError(errorMsg);
      toast.error(errorMsg);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isLoading={loading && !upload} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-3 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Upload Detail</h1>
            <p className="text-gray-600">View page images and OCR text, edit text or redo OCR.</p>
            {upload && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-500">File: {upload.original_filename || upload.filename}</span>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={upload.upload_status || upload.status} type="upload" />
                  <StatusBadge status={upload.ocr_status || 'pending'} type="ocr" />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Pages table - main content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Upload Pages</h2>
            <div className="text-sm text-gray-500">
              Total: {pages.length} pages
            </div>
          </div>
          
          {pages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OCR Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map(p => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/pages/${p.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-indigo-600 font-medium text-sm">
                          Image {p.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {p.page_no || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={p.upload_status || 'pending'} type="upload" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={p.ocr_status || 'pending'} type="ocr" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-indigo-600 font-medium">
                          View Details →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No pages found for this upload</p>
                <p className="text-sm mt-2">Pages will appear here once they are processed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
