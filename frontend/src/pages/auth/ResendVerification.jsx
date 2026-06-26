import api from "../../api/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";
import AuthInput from "../../components/auth/AuthInput";

const ResendVerification = () => {
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

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/auth/resend-verification-email", { email });
      setSuccessMessage(response.data.message || "Verification email sent.");
      setTimeout(() => navigate("/verify-email", { state: { email } }), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data.message || "Failed to resend email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Resend code">
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert type="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="auth-label">Email</label>
          <AuthInput
            icon={FaEnvelope}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          {isSubmitting ? "Sending..." : "Resend email"}
        </button>

        <p className="auth-footer">
          <button type="button" onClick={() => navigate("/verify-email")} className="auth-btn-link">
            Back to verification
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ResendVerification;
