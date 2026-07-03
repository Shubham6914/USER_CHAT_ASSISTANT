import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import Loader from "../common/Loader";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  /**
   * Wait until localStorage
   * authentication check completes
   */
  if (loading) {
    return <Loader />;
  }

  /**
   * User not authenticated
   */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;