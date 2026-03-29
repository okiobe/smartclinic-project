import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { Role } from "../../store/auth.store";
import { useAuth } from "../../store/useAuth";

export default function ProtectedRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
