"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim())    { setError("Please enter your email address."); return; }
    if (!form.password)        { setError("Please enter your password."); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = login(form.email, form.password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left decorative panel ── */}
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel__ornament">
          <Image src="/Logo.jpeg" alt="Braj Madhuri Logo" fill className="auth-panel__logo" />
        </div>
        <h2 className="auth-panel__title">Welcome Back,<br />Devotee</h2>
        <div className="auth-panel__divider" />
        <p className="auth-panel__tagline">
          Sign in to continue your journey with The Braj Madhuri's sacred collection of pooja essentials.
        </p>
        <div className="auth-panel__values">
          {[
            ["🪷", "Agarbatti & Dhoop Sticks"],
            ["📿", "Japa Mala & Shringar"],
            ["🫙", "Attars & Floral Scents"],
            ["👘", "Thakur Ji Poshak"],
          ].map(([icon, text]) => (
            <div className="auth-panel__value" key={text}>
              <span className="auth-panel__value-icon">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <Link href="/" className="auth-back">
            <span className="auth-back__arrow">←</span> Back to Home
          </Link>

          <span className="auth-card__eyebrow">Jai Shri Krishna 🪷</span>
          <h1 className="auth-card__title">Sign In</h1>
          <p className="auth-card__subtitle">
            Welcome back. Enter your details to continue.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error__icon">⚠️</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder=" "
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  required
                />
                <label className="auth-label" htmlFor="login-email">Email Address</label>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder=" "
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <label className="auth-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="auth-forgot">
              <Link href="/forgot-password" className="auth-forgot-link">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" />Signing In…</>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p className="auth-switch">
            Don&rsquo;t have an account?{" "}
            <Link href="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
