import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, RefreshCcw, Save } from 'lucide-react';
import api from '../api/axios';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [selected, setSelected] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [saving, setSaving] = useState(false);
  const [redoingOCR, setRedoingOCR] = useState(false);

  useEffect(() => { fetchData(); }, [uploadId]);

  async function fetchData(){
    try{
      setLoading(true);
      const ures = await api.get(`/uploads/${uploadId}`);
      const ubody = ures.data;
      setUpload(ubody.data || ubody);
      const pres = await api.get(`/uploads/${uploadId}/pages`, { params: { page: 1, per_page: 100 } });
      const pbody = pres.data;
      const rows = pbody.data?.pages || pbody.pages || [];
      setPages(rows);
      if(rows.length){ selectPage(rows[0]); }
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

  function selectPage(p){
    // Defensive normalization: ensure blob_url is a safe, loadable URL.
    const normalized = { ...p };
    if (normalized.blob_url) {
      // If blob_url is a full URL (http/https) leave it.
      if (!/^https?:\/\//i.test(normalized.blob_url)) {
        // If it already starts with a slash, keep it; otherwise prefix a slash.
        if (!normalized.blob_url.startsWith('/')) {
          normalized.blob_url = '/' + normalized.blob_url;
        }
      }
    }
    setSelected(normalized);
    setOcrText(p.ocr_text || '');
  }

  async function saveOCR(){
    if(!selected) return;
    try{
      setSaving(true);
      toast.info('Saving OCR text...');
      await api.patch(`/pages/${selected.id}/ocr`, { ocr_text: ocrText });
      toast.success('OCR text saved successfully');
      await fetchData();
    }catch(e){
      console.error('Save OCR failed', e);
      const errorMsg = 'Failed to save OCR text.';
      setError(errorMsg);
      toast.error(errorMsg);
    }finally{ setSaving(false); }
  }

  async function redoOCR(){
    if(!selected) return;
    try{
      setRedoingOCR(true);
      toast.info('Initiating OCR redo...');
      await api.post(`/pages/${selected.id}/ocr/redo`);
      toast.success('OCR redo initiated successfully. Processing will begin shortly.');
      await fetchData();
    }catch(e){
      console.error('Redo OCR failed', e);
      const errorMsg = 'Failed to redo OCR.';
      setError(errorMsg);
      toast.error(errorMsg);
    }finally{ setRedoingOCR(false); }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pages list and image preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pages</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[60vh] overflow-auto">
              {pages.map(p => (
                <div key={p.id} className="relative">
                  <button onClick={() => selectPage(p)} className={`w-full border rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selected && selected.id === p.id ? 'ring-2 ring-indigo-500' : ''}`}>
                    <img src={(p.blob_url && (/^https?:\/\//i.test(p.blob_url) ? p.blob_url : (p.blob_url.startsWith('/') ? p.blob_url : '/' + p.blob_url))) || ''} alt="page" className="w-full h-24 object-cover" />
                  </button>
                  <div className="absolute top-1 right-1">
                    <StatusBadge status={p.ocr_status || 'pending'} type="ocr" className="text-xs scale-75 origin-top-right" />
                  </div>
                </div>
              ))}
            </div>
            {selected && (
              <div className="mt-4">
                <img src={selected.blob_url} alt="selected" className="w-full max-h-[60vh] object-contain bg-gray-50 border rounded" />
              </div>
            )}
          </div>

          {/* OCR editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">OCR Text</h2>
              <div className="space-x-2">
                <button onClick={redoOCR} disabled={!selected || redoingOCR || saving} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">
                  {redoingOCR ? (
                    <>
                      <LoadingSpinner size="small" className="mr-1" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Redo OCR
                    </>
                  )}
                </button>
                <button onClick={saveOCR} disabled={!selected || saving || redoingOCR} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? (
                    <>
                      <LoadingSpinner size="small" className="mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea value={ocrText} onChange={e=>setOcrText(e.target.value)} className="flex-1 min-h-32 border rounded-md p-3 font-mono text-sm" placeholder="OCR text will appear here..." />
          </div>
        </div>
      </div>
    </div>
  );
}
