import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastProvider from './components/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import DevModeModal from './components/DevModeModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadsPage from './pages/UploadsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import ExamAnomaliesPage from './pages/ExamAnomaliesPage';
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
import PageDetailPage from './pages/PageDetailPage';
import CandidatePagesView from './pages/CandidatePagesView';
import './App.css';

import './App.css';

// Inner App component to use useAuth hook
const AppContent = () => {
  const { showDevModal, confirmDevMode } = useAuth();

  return (
    <>
      {showDevModal && <DevModeModal onSelect={confirmDevMode} />}
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
          <Route path="/candidates/:candidateId/pages" element={<ProtectedRoute><CandidatePagesView /></ProtectedRoute>} />
          <Route path="/pages/:pageId" element={<ProtectedRoute><PageDetailPage /></ProtectedRoute>} />
          <Route path="/anomalies" element={<ProtectedRoute><AnomaliesPage /></ProtectedRoute>} />
          <Route path="/anomalies/exam/:examId" element={<ProtectedRoute><ExamAnomaliesPage /></ProtectedRoute>} />
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
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
