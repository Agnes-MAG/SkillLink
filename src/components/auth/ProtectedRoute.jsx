import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from '../common/FullPageLoader'

export function ProtectedRoute({ requireAdmin = false, requireOnboarding = true }) {
  const { user, profile, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader label="Checking your session" />

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  if (profile?.status === 'suspended') return <Navigate to="/suspended" replace />

  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
