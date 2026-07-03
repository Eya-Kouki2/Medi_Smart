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
      <div className="min-h-screen flex items-center justify-center bg-main-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-health-blue/10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-health-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Loading MediSmart Hub…</p>
        </div>
      </div>
    );
  }

  if (!user?.area) {
    return null;
  }

  return (
    <div className="min-h-screen bg-main-bg">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="ml-56 min-h-screen p-6 sm:p-8 overflow-auto min-w-0">
        <Outlet context={{ user, refreshUser }} />
      </main>
    </div>
  );
};

export default AdminLayout;
