import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/client";
import { motion } from "framer-motion";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("aisha@example.com");
  const [password, setPassword] = useState("12345678");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      const token = result.data?.accessToken || result.accessToken || "";
      const userEmail = result.data?.user?.email || result.user?.email || email;

      if (!token) {
        throw new Error("No access token returned from login");
      }

      localStorage.setItem("frontend_access_token", token);
      localStorage.setItem("frontend_user_email", userEmail);

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="login-card"
      >
        <div className="login-top">
          <div className="login-badge">
            <Sparkles size={16} />
            🌸 Your Journey Starts Here 🌷💗
          </div>
          <h1>Welcome to Sweet Pipeline</h1>
          <p>Login to explore pipelines, jobs, and chaining dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <label>Email</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <label>Password</label>
          <div className="input-wrap">
            <LockKeyhole size={16} />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="switch-auth">
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
