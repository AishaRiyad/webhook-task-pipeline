import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api/client";
import { motion } from "framer-motion";
import { LockKeyhole, Mail, Sparkles, UserPlus } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
            🌸💗Create Account💗🌸
          </div>
          <h1>Join Sweet Pipeline</h1>
          <p>Create your account to manage pipelines, chaining, and jobs.</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">
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

          <label>Confirm Password</label>
          <div className="input-wrap">
            <LockKeyhole size={16} />
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirm your password"
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <div className="switch-auth">
            Already have an account? <Link to="/">Login</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}