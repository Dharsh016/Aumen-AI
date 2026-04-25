import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/client";

export default function Register() {
  const [name, setName] = useState("");
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
      const resp = await registerUser(name, email, password);
      localStorage.setItem("lexicore_user", JSON.stringify(resp.user));
      // reload to ensure App reads new user state
      if (resp.user.is_admin) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/add";
      }
    } catch (err: unknown) {
      setError("Registration failed. Check input and try again.");
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join LexiCore to start tracking your vocabulary progress.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </div>
          {error && <p className="inline-error">{error}</p>}
          <div className="auth-footer-links">
            <a href="/login">Already have an account?</a>
          </div>
        </form>
      </div>
    </section>
  );
}
