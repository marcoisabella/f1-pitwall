import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingTelemetry } from './LoadingTelemetry';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingTelemetry />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
