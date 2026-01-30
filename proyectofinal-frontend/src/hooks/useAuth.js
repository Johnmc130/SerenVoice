import { useState, useEffect } from "react";
import authService from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();

        // Normalizamos roles - el authService ya tiene role y roles
        const normalizedUser = {
          ...userData,
          role: userData?.role || (userData?.roles?.[0]?.toLowerCase() || 'usuario'),
          roles: userData?.roles || ['usuario']
        };

        setUser(normalizedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    // authService ya normaliza role y roles
    const normalizedUser = {
      ...data.user,
      role: data.user?.role || 'usuario',
      roles: data.user?.roles || ['usuario']
    };

    setUser(normalizedUser);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);

    // authService ya normaliza role y roles
    const normalizedUser = {
      ...data.user,
      role: data.user?.role || 'usuario',
      roles: data.user?.roles || ['usuario']
    };

    setUser(normalizedUser);
    setIsAuthenticated(true);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };
};
