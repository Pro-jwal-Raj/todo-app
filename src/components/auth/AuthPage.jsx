import { useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../../stores/authStore";
import { isSupabaseConfigured } from "../../lib/supabase";
import { FiMail, FiLock, FiUser, FiLogIn, FiUserPlus, FiAlertTriangle } from "react-icons/fi";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const error = useAuthStore((s) => s.error);
  const loading = useAuthStore((s) => s.loading);
  const clearError = useAuthStore((s) => s.clearError);

  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        return;
      }
      if (password.length < 6) {
        return;
      }
      const result = await signUp(email, password, displayName);
      if (result) {
        setSuccess("Account created! Check your email to confirm.");
        setMode("login");
      }
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="auth-header">
          <h1>✨ TaskFlow</h1>
          <p>{mode === "login" ? "Welcome back" : "Create your account"}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); clearError(); }}
          >
            <FiLogIn /> Sign In
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); clearError(); }}
          >
            <FiUserPlus /> Sign Up
          </button>
        </div>

        {!isSupabaseConfigured && (
          <motion.div
            className="auth-setup-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle />
            <div>
              <strong>Backend not configured</strong>
              <p>
                Create a <code>.env</code> file in the project root with your
                Supabase credentials, then restart the dev server. See{" "}
                <code>.env.example</code> for the format.
              </p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                Get free credentials at{" "}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent-light)" }}
                >
                  app.supabase.com
                </a>{" "}
                → Project Settings → API
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="auth-success"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="auth-field">
              <FiUser className="auth-field-icon" />
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="auth-field">
            <FiMail className="auth-field-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <FiLock className="auth-field-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <FiLock className="auth-field-icon" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-field-error">Passwords don't match</span>
              )}
            </div>
          )}

          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading || (mode === "signup" && password !== confirmPassword)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </motion.button>
        </form>

        <p className="auth-footer">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            className="auth-link"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); clearError(); }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
