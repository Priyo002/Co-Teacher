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
import ApplyMentorPage from './pages/ApplyMentorPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MentorDashboardPage from './pages/MentorDashboardPage';
import FindMentorPage from './pages/FindMentorPage';
import StudentSessionsPage from './pages/StudentSessionsPage';
import FocusAnalyticsPage from './pages/FocusAnalyticsPage';
import LearningPathViewerPage from './pages/LearningPathViewerPage';
import IDEPage from './pages/IDEPage';

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
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            color: '#0f172a',
            fontWeight: '600',
            padding: '12px 24px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/profile" element={<DashboardPage><ProfilePage /></DashboardPage>} />
        <Route path="/" element={<DashboardPage><HomePage /></DashboardPage>} />
        <Route path="/course/:id" element={<DashboardPage><CourseOverviewPage /></DashboardPage>} />
        <Route path="/path/:id" element={<DashboardPage><LearningPathViewerPage /></DashboardPage>} />
        <Route path="/certificate/:id" element={<CertificatePage />} />
        <Route path="/course/:id/test" element={<DashboardPage><FinalTestPage /></DashboardPage>} />
        <Route path="/course/:courseId/lesson/:id" element={<DashboardPage><LessonViewerPage /></DashboardPage>} />
        <Route path="/course/:courseId/lesson/:id/test" element={<DashboardPage><LessonTestPage /></DashboardPage>} />
        <Route path="/leaderboard" element={<DashboardPage><LeaderboardPage /></DashboardPage>} />
        <Route path="/billing" element={<DashboardPage><BillingHistoryPage /></DashboardPage>} />
        <Route path="/credit-history" element={<DashboardPage><CreditHistoryPage /></DashboardPage>} />
        <Route path="/my-sessions" element={<DashboardPage><StudentSessionsPage /></DashboardPage>} />
        <Route path="/mentors" element={<DashboardPage><FindMentorPage /></DashboardPage>} />
        <Route path="/become-mentor" element={<DashboardPage><ApplyMentorPage /></DashboardPage>} />
        <Route path="/mentor-dashboard" element={<DashboardPage><MentorDashboardPage /></DashboardPage>} />
        <Route path="/analytics" element={<DashboardPage><FocusAnalyticsPage /></DashboardPage>} />
        <Route path="/admin" element={<DashboardPage><AdminDashboardPage /></DashboardPage>} />
        <Route path="/ide" element={<DashboardPage><IDEPage /></DashboardPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
