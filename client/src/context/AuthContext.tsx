import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client.ts";
import { User, Center } from "../types/index.ts";

interface AuthContextType {
  user: User | null;
  center: Center | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    centerName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateCenterState: (center: Center) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("nexomanager_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [center, setCenter] = useState<Center | null>(() => {
    const saved = localStorage.getItem("nexomanager_center");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("nexomanager_token")
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const currentToken = localStorage.getItem("nexomanager_token");
      if (!currentToken) {
        setIsLoading(false);
        return;
      }
      const res = await api.get("/auth/me");
      if (res.data.success) {
        setUser(res.data.user);
        setCenter(res.data.center);
        localStorage.setItem("nexomanager_user", JSON.stringify(res.data.user));
        if (res.data.center) {
          localStorage.setItem("nexomanager_center", JSON.stringify(res.data.center));
        }
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser, center: newCenter } = res.data;
      setToken(newToken);
      setUser(newUser);
      setCenter(newCenter);
      localStorage.setItem("nexomanager_token", newToken);
      localStorage.setItem("nexomanager_user", JSON.stringify(newUser));
      if (newCenter) {
        localStorage.setItem("nexomanager_center", JSON.stringify(newCenter));
      }
    }
  };

  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    centerName: string;
    phone?: string;
  }) => {
    const res = await api.post("/auth/register", payload);
    if (res.data.success) {
      const { token: newToken, user: newUser, center: newCenter } = res.data;
      setToken(newToken);
      setUser(newUser);
      setCenter(newCenter);
      localStorage.setItem("nexomanager_token", newToken);
      localStorage.setItem("nexomanager_user", JSON.stringify(newUser));
      if (newCenter) {
        localStorage.setItem("nexomanager_center", JSON.stringify(newCenter));
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCenter(null);
    localStorage.removeItem("nexomanager_token");
    localStorage.removeItem("nexomanager_user");
    localStorage.removeItem("nexomanager_center");
  };

  const updateCenterState = (updatedCenter: Center) => {
    setCenter(updatedCenter);
    localStorage.setItem("nexomanager_center", JSON.stringify(updatedCenter));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        center,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateCenterState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
