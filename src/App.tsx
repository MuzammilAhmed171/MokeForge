import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { useStudio } from './store';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { useEffect } from 'react';

function AppContent() {
  const booted = useStudio(s => s.booted);
  const view = useStudio(s => s.view);
  const project = useStudio(s => s.project);
  const boot = useStudio(s => s.boot);

  useEffect(() => { boot(); }, [boot]);
  
  if (!booted) return null;

  // If user is in editor view, show editor
  if (view === 'editor' && project) {
    return <Editor />;
  }

  // Otherwise show dashboard or editor based on view
  return view === 'editor' && project ? <Editor /> : <Dashboard />;
}

function EditorRoute() {
  const goto = useStudio(s => s.goto);
  const openProject = useStudio(s => s.openProject);
  const projects = useStudio(s => s.projects);
  
  // If no projects, redirect to dashboard
  if (projects.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Open first project
  if (projects.length > 0) {
    openProject(projects[0].id);
  }
  
  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route path="/verify-email" element={
            <ProtectedRoute>
              <VerifyEmailPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/editor" element={
            <ProtectedRoute>
              <EditorRoute />
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
