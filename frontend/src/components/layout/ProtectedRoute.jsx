import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  /**
   * Wait until localStorage
   * authentication check completes
   */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
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