import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './components/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadsPage from './pages/UploadsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import MarkingGroupsPage from './pages/MarkingGroupsPage';
import ResultsPage from './pages/ResultsPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import SchemesPage from './pages/SchemesPage';
import UploadScheme from './pages/UploadScheme';
import GroupsPage from './pages/GroupsPage';
import AccountPage from './pages/AccountPage';
import PricingPage from './pages/PricingPage';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import GroupUploadsPage from './pages/GroupUploadsPage';
import UploadDetailPage from './pages/UploadDetailPage';
import './App.css';

export default function App(){
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/uploads" element={<ProtectedRoute><UploadsPage /></ProtectedRoute>} />
          <Route path="/uploads/:uploadId" element={<ProtectedRoute><UploadDetailPage /></ProtectedRoute>} />
          <Route path="/uploads/group/:groupId" element={<ProtectedRoute><GroupUploadsPage /></ProtectedRoute>} />
          <Route path="/anomalies" element={<ProtectedRoute><AnomaliesPage /></ProtectedRoute>} />
          <Route path="/anomalies/:groupId" element={<ProtectedRoute><AnomaliesPage /></ProtectedRoute>} />
          <Route path="/marking" element={<ProtectedRoute><MarkingGroupsPage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/results/group/:groupId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/results/candidates/:candidateId" element={<ProtectedRoute><CandidateDetailPage /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><SchemesPage /></ProtectedRoute>} />
          <Route path="/upload-scheme" element={<ProtectedRoute><UploadScheme /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
