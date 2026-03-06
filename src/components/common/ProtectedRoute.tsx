import { Navigate } from "react-router-dom";
import { authStore } from "../../store/auth.store";
import type { Role } from "../../store/auth.store";

export default function ProtectedRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = authStore.getState();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role))
    return <Navigate to="/403" replace />;

  return <>{children}</>;
}
