import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import api from '../api/axios';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [plan, setPlan] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Accept plan from ?plan= or from localStorage set by Pricing actions
    const params = new URLSearchParams(location.search);
    const qPlan = params.get('plan');
    const saved = localStorage.getItem('selectedPlan');
    if (qPlan) setPlan(qPlan);
    else if (saved) setPlan(saved);
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        plan: plan
      });

      // Registration successful - redirect to login
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please sign in to continue.' 
        }
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 login-hero-bg">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="p-6 rounded-xl bg-white/85 shadow-xl login-card backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h2 className="text-2xl font-bold">Create Account</h2>
              <p className="text-sm text-gray-500">Join Smartscript and start grading smarter.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600">Plan</label>
              <select value={plan} onChange={e=>setPlan(e.target.value)} className="mt-1 w-full border rounded-md p-3">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="institutional">Institutional (SaaS)</option>
                <option value="onprem">On-Premise</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">You can change or upgrade later.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="input-icon icon-fallback text-gray-400" size={18} />
                </div>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="pl-12 w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="input-icon icon-fallback text-gray-400" size={18} />
                </div>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="pl-12 w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Mail className="input-icon icon-fallback text-gray-400" size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="pl-12 w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="input-icon icon-fallback text-gray-400" size={18} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (min. 6 characters)"
                className="pl-12 w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="input-icon icon-fallback text-gray-400" size={18} />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="pl-12 w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md text-white bg-gradient-to-r from-[#4f46e5] to-[#2563eb] shadow btn-fallback hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 underline">
              Sign in here
            </Link>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center gap-4 p-4 login-side">
          <div className="w-full bg-white rounded-xl p-6 shadow-lg shimmer-line">
            <h3 className="text-lg font-semibold mb-2">Get Started Today</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 5 free scripts to try our AI marking</li>
              <li>• Upload PDFs or images of student scripts</li>
              <li>• Get consistent grading with custom schemes</li>
              <li>• Export results to Excel or PDF</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <div className="p-2 bg-white rounded-lg shadow float">
              <svg className="w-6 h-6 text-smart-indigo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v7c0 5 3.58 9 9 9s9-4 9-9V7l-9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="p-2 bg-white rounded-lg shadow float delay-75">
              <svg className="w-6 h-6 text-smart-indigo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V7a2 2 0 00-2-2h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18v-5a4 4 0 014-4h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
