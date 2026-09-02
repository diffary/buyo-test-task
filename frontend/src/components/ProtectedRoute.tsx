import { Navigate } from "react-router-dom";
import { useAppSelector } from "../utils/store/hooks";

interface ProtectedRouteProps {
  children: React.JSX.Element;
  allowedRoles?: string[];
  allowedLogins?: string[];
  offers_access?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, allowedLogins, offers_access }: ProtectedRouteProps) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAllowedRole = Boolean(allowedRoles?.includes(user.role));
  const hasAllowedLogin = Boolean(allowedLogins?.includes(user.login));
  const hasOffersAccess = Boolean(offers_access && user.offers_access);

  if (hasAllowedRole || hasAllowedLogin || hasOffersAccess) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
