import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setAdmin)
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const { token, admin: a } = await api.login({ email, password });
    setToken(token);
    setAdmin(a);
    return a;
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
  };

  // Derived role helpers
  const isTechAdmin = admin?.role === "TECHNICAL_ADMIN";
  const isAdmin = !!admin; // any role

  return (
    <AuthContext.Provider value={{ admin, ready, login, logout, isTechAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
