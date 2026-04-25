import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await loginUser(email, password);
      localStorage.setItem("lexicore_user", JSON.stringify(resp.user));
      // reload to ensure App reads new user state
      if (resp.user.is_admin) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/add";
      }
    } catch (err: unknown) {
      setError("Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add("auth-active");
    return () => {
      document.body.classList.remove("auth-active");
    };
  }, []);

  return (
    <section className="page-shell auth-shell">
      <div className="auth-card ui-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Access your LexiCore account to continue.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
          {error && <p className="inline-error">{error}</p>}
          <div className="auth-footer-links">
            <a href="/register">Create account</a>
          </div>
        </form>
      </div>
    </section>
  );
}
