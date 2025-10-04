import React, { createContext, useState, useEffect } from "react";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ✅ Login method
  const login = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // ✅ Logout method
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ✅ Load user from storage or backend
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else if (token) {
      api
        .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data.success === false) {
            alert(res.data.message || "Login failed");
            logout();
          } else {
            setUser(res.data.user);
          }
        })
        .catch((err) => {
          console.error(err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // ✅ Handle Google OAuth callback
  useEffect(() => {
    // Check if backend redirected with ?error=... in query params
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const message = params.get("message");

    if (error) {
      alert(message || "Google login failed");
      logout();
      // Remove query params so alert doesn’t keep popping up
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
