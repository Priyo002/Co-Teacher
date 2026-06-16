import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading..." />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function DashboardPage({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(21, 24, 40, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
            color: '#e2e8f0',
            backdropFilter: 'blur(16px)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/" element={<DashboardPage><HomePage /></DashboardPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
