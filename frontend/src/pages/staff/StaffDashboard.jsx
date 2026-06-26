import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const StaffDashboard = ({ expectedRole, title }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/auth/check-auth");
        const currentUser = response.data.user;

        if (currentUser.role !== expectedRole) {
          navigate("/login");
          return;
        }

        if (!currentUser.area) {
          navigate("/login");
          return;
        }

        setUser(currentUser);
      } catch {
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, expectedRole]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
        <span className="inline-block mb-4 px-3 py-1 text-sm capitalize bg-green-100 text-green-700 rounded-full">
          {expectedRole}
        </span>
        <h1 className="text-3xl font-bold text-gray-700 mb-2">
          {title}
        </h1>
        <p className="text-gray-600 mb-1">Welcome, {user?.name}!</p>
        <p className="text-gray-500 text-sm mb-6">
          Area: <strong>{user?.area?.name}</strong>
          {user?.area?.address && ` — ${user.area.address}`}
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default StaffDashboard;
