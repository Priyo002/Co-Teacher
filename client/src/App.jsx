import { Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import AppSkeleton from './components/skeletons/AppSkeleton';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CourseOverviewPage from './pages/CourseOverviewPage';
import LessonViewerPage from './pages/LessonViewerPage';
import CertificatePage from './pages/CertificatePage';
import FinalTestPage from './pages/FinalTestPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';
import LessonTestPage from './pages/LessonTestPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BillingHistoryPage from './pages/BillingHistoryPage';
import CreditHistoryPage from './pages/CreditHistoryPage';

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AppSkeleton />;
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
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/profile" element={<DashboardPage><ProfilePage /></DashboardPage>} />
        <Route path="/" element={<DashboardPage><HomePage /></DashboardPage>} />
        <Route path="/course/:id" element={<DashboardPage><CourseOverviewPage /></DashboardPage>} />
        <Route path="/certificate/:id" element={<CertificatePage />} />
        <Route path="/course/:id/test" element={<DashboardPage><FinalTestPage /></DashboardPage>} />
        <Route path="/course/:courseId/lesson/:id" element={<DashboardPage><LessonViewerPage /></DashboardPage>} />
        <Route path="/course/:courseId/lesson/:id/test" element={<DashboardPage><LessonTestPage /></DashboardPage>} />
        <Route path="/leaderboard" element={<DashboardPage><LeaderboardPage /></DashboardPage>} />
        <Route path="/billing" element={<DashboardPage><BillingHistoryPage /></DashboardPage>} />
        <Route path="/credit-history" element={<DashboardPage><CreditHistoryPage /></DashboardPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
