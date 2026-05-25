import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 login-hero-bg">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
  <div className="p-6 rounded-xl bg-white/85 shadow-xl login-card backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo.png" alt="SmartScript Logo" className="w-12 h-12 object-contain" />
            <div>
              <h2 className="text-2xl font-bold">SmartScript</h2>
              <p className="text-sm text-gray-500">AI-assisted grading platform for educators.</p>
            </div>
          </div>
    {/* Decorative icons removed — hero background used instead */}

      <form onSubmit={onSubmit} className="space-y-4">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}
            {err && <div className="text-red-600">{err}</div>}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
  <svg className="input-icon icon-fallback text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
              </div>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="pl-12 w-full border rounded-md p-3" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="input-icon icon-fallback text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3 .895 3 2v3H9v-3c0-1.105 1.343-2 3-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11V9a5 5 0 10-10 0v2" /></svg>
              </div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="pl-12 w-full border rounded-md p-3" />
            </div>

            <button disabled={loading} className="w-full py-3 rounded-md text-white bg-gradient-to-r from-[#4f46e5] to-[#2563eb] shadow btn-fallback">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            <div>Don't have an account? <Link to="/signup" className="text-blue-600 underline hover:text-blue-700">Create one here</Link></div>
          </div>
        </div>

  <div className="hidden md:flex flex-col items-center justify-center gap-4 p-4 login-side">
          <div className="w-full bg-white rounded-xl p-6 shadow-lg shimmer-line">
            <h3 className="text-lg font-semibold mb-2">Why Smartscript?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Automated OCR & marking</li>
              <li>• Consistent grading with schemes</li>
              <li>• Exportable results and analytics</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <div className="p-2 bg-white rounded-lg shadow float">
              <svg className="w-6 h-6 text-smart-indigo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 7v7c0 5 3.58 9 9 9s9-4 9-9V7l-9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="p-2 bg-white rounded-lg shadow float delay-75">
              <svg className="w-6 h-6 text-smart-indigo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 8V7a2 2 0 00-2-2h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 18v-5a4 4 0 014-4h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
