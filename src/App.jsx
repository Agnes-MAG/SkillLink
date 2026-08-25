import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AdminPage from './pages/AdminPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import DiscoverPage from './pages/DiscoverPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import SessionsPage from './pages/SessionsPage'
import SuspendedPage from './pages/SuspendedPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className:
                'rounded-xl! text-sm! shadow-lg! dark:bg-slate-800! dark:text-slate-100!',
              duration: 4000,
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/suspended" element={<SuspendedPage />} />

            <Route element={<ProtectedRoute requireOnboarding={false} />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>

            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
