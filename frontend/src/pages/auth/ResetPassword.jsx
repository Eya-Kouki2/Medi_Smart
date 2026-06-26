import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";
import PasswordInput from "../../components/auth/PasswordInput";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = location.state?.email;
  const code = location.state?.code;

  useEffect(() => {
    if (!email || !code) {
      navigate("/reset-password-code", { replace: true });
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/auth/reset-password", { email, code, password });
      setSuccessMessage("Password updated! Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data.message || "Reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !code) {
    return null;
  }

  return (
    <AuthLayout title="New password" subtitle="Choose a strong password for your account">
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert type="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="password" className="auth-label">New password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="auth-label">Confirm new password</label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary !mt-4">
          {isSubmitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
