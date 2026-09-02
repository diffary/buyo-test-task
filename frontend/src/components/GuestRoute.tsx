import { Navigate } from "react-router-dom";
import { useAppSelector } from "../utils/store/hooks";

interface GuestRouteProps {
  children: React.JSX.Element;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
