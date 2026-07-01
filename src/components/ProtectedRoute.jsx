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

// Tech Admin only — redirects regular admins to the main admin dashboard
export const TechAdminRoute = ({ children }) => {
  const { admin, ready, isTechAdmin } = useAuth();

  if (!ready)
    return (
      <div
        style={{
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          background: "#060610",
          color: "#7b7b9a",
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
        }}
      >
        Authenticating…
      </div>
    );

  if (!admin) return <Navigate to="/admin/login" replace />;
  if (!isTechAdmin) return <Navigate to="/admin" replace />;
  return children;
};

export default ProtectedRoute;
