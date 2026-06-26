import api from "../../api/axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaShieldAlt } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";
import AuthInput from "../../components/auth/AuthInput";

const VerifyResetCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!code.trim()) {
      setErrorMessage("Enter the reset code from your email.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/auth/verify-reset-code", { email, code: code.trim() });
      navigate("/reset-password", { state: { email, code: code.trim() } });
    } catch (error) {
      setErrorMessage(error.response?.data.message || "Invalid or expired code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Enter reset code" subtitle="Check your email for the 6-digit code">
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="email" className="auth-label">Email</label>
          <AuthInput
            id="email"
            icon={FaEnvelope}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label htmlFor="code" className="auth-label">Reset code</label>
          <AuthInput
            id="code"
            icon={FaShieldAlt}
            onChange={(e) => setCode(e.target.value)}
            value={code}
            type="text"
            placeholder="000000"
            maxLength={6}
            className="text-center font-mono tracking-widest"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          {isSubmitting ? "Verifying..." : "Continue"}
        </button>

        <p className="auth-footer">
          <button type="button" onClick={() => navigate("/forgot-password")} className="auth-btn-link">
            Request a new code
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyResetCode;
