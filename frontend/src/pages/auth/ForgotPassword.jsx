import api from "../../api/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";
import AuthInput from "../../components/auth/AuthInput";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Enter a valid email.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/auth/forgot-password", { email });
      setSuccessMessage(response.data.message || "Reset code sent to your email.");
      setTimeout(() => navigate("/reset-password-code", { state: { email } }), 1500);
    } catch (error) {
      setErrorMessage(error.response?.data.message || "Failed to send reset code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Forgot password">
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert type="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="auth-label">Email</label>
          <AuthInput
            icon={FaEnvelope}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="you@email.com"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          {isSubmitting ? "Sending..." : "Send reset code"}
        </button>

        <p className="auth-footer">
          <button type="button" onClick={() => navigate("/login")} className="auth-btn-link">
            Back to sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
