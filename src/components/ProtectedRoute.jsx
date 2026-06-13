import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { admin, ready } = useAuth();

  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-stone">
        Loading…
      </div>
    );

  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

export default ProtectedRoute;
