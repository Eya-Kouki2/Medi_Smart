import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCopy, FaCheck } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";

const AdminSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ name: "", address: "" });
  const [area, setArea] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/auth/check-auth");
        const user = response.data.user;

        if (user.role !== "admin") {
          navigate("/login", { replace: true });
          return;
        }

        if (user.area) {
          navigate("/admin", { replace: true });
          return;
        }
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("Clinic name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/areas/create", form);
      setArea(response.data.area);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to create your clinic area.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!area?.code) return;
    navigator.clipboard.writeText(area.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title={area ? "Your area is ready" : "Set up your clinic"}
      subtitle={
        area
          ? "Share this code with nurses so they can join your area."
          : "Add your clinic details to generate a shareable area code."
      }
    >
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}

      {!area ? (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="auth-label" htmlFor="name">
              Clinic name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. MediSmart Downtown"
              className="auth-input"
            />
          </div>

          <div>
            <label className="auth-label" htmlFor="address">
              Address <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="address"
              type="text"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Street, city"
              className="auth-input"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
            {isSubmitting ? "Creating..." : "Create area & get code"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-health-ice bg-health-ice/30 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-health-blue/70 mb-1">
              Area code
            </p>
            <p className="text-2xl font-mono font-bold tracking-widest text-health-navy">{area.code}</p>
            <p className="text-xs text-gray-500 mt-2">{area.name}</p>
            {area.address && <p className="text-[11px] text-gray-400 mt-0.5">{area.address}</p>}
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-health-blue/20 text-health-blue text-xs font-semibold hover:bg-health-ice/40 transition-colors"
          >
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? "Copied!" : "Copy area code"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="auth-btn-primary"
          >
            Continue to dashboard
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default AdminSetup;
