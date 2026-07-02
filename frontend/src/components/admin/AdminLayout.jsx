import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/api/auth/check-auth");
      if (response.data.user.role !== "admin") {
        navigate("/login");
        return;
      }
      setUser(response.data.user);
      return response.data.user;
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await refreshUser();
        if (currentUser && !currentUser.area) {
          navigate("/admin/setup", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [refreshUser, navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user?.area) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="ml-56 min-h-screen p-5 overflow-auto min-w-0">
        <Outlet context={{ user, refreshUser }} />
      </main>
    </div>
  );
};

export default AdminLayout;
