import api from "../../api/axios";
import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getPostLoginPath } from "../../utils/getDashboardPath";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthAlert from "../../components/auth/AuthAlert";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";

const Login = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!data.email || !data.password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/auth/login", data);
      navigate(getPostLoginPath(response.data.user));
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || "Invalid email or password.");
      } else if (error.request) {
        setErrorMessage("Unable to connect to the server.");
      } else {
        setErrorMessage("Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {errorMessage && (
        <AuthAlert type="error">
          {errorMessage}
          {errorMessage === "Email not verified. Please verify your email first." && (
            <button
              type="button"
              onClick={() => navigate("/verify-email")}
              className="mt-2 block w-full py-1.5 rounded-md bg-health-blue text-white text-xs hover:bg-health-navy"
            >
              Verify email
            </button>
          )}
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="auth-label" htmlFor="email">Email</label>
          <AuthInput
            id="email"
            name="email"
            icon={FaEnvelope}
            onChange={handleInputChange}
            value={data.email}
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="auth-label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            onChange={handleInputChange}
            value={data.password}
          />
        </div>

        <div className="text-right -mt-1">
          <button type="button" onClick={() => navigate("/forgot-password")} className="auth-btn-link">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-footer">
          No account?{" "}
          <button type="button" onClick={() => navigate("/signup")} className="auth-btn-link">
            Sign up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
