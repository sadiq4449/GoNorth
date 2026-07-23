import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="container loading-page">Loading…</div>
  }

  if (!user) {
    const loginPath = roles?.includes('admin')
      ? '/admin/login'
      : roles?.includes('vendor')
        ? '/vendor/login'
        : '/vendor/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'vendor' ? '/vendor' : user.role === 'admin' ? '/admin' : '/'
    return <Navigate to={fallback} replace />
  }

  return children
}
