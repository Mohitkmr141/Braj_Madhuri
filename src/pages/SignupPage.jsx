"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_CLASSES = ["", "weak", "fair", "good", "strong"];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (!form.email.trim()) { setError("Please enter your email address."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match. Please re-enter."); return; }

    setLoading(true);
    // Small delay for UX feel
    await new Promise((r) => setTimeout(r, 600));

    const result = signup(form.name, form.email, form.password);
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
        <div className="auth-panel__ornament">🪷</div>
        <h2 className="auth-panel__title">Join Our<br />Devotional Family</h2>
        <div className="auth-panel__divider" />
        <p className="auth-panel__tagline">
          Create your account and be part of a community dedicated to sacred seva and divine devotion.
        </p>
        <div className="auth-panel__values">
          {[
            ["🛕", "Exclusive devotional collections"],
            ["📦", "Order tracking and history"],
            ["✨", "Early access to new arrivals"],
            ["🎁", "Special offers for devotees"],
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

          <span className="auth-card__eyebrow">Radhe Radhe 🪷</span>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">
            Begin your journey with The Braj Madhuri.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error__icon">⚠️</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-name">Full Name</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className={`auth-input${error && !form.name ? " auth-input--error" : ""}`}
                  placeholder="Your name…"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder="Min. 6 characters…"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
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

            {/* Password strength */}
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength__bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`auth-strength__bar${strength >= level ? ` auth-strength__bar--${STRENGTH_CLASSES[strength]}` : ""}`}
                    />
                  ))}
                </div>
                <span className="auth-strength__label">
                  Password strength: {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-confirm"
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  className={`auth-input${form.confirm && form.confirm !== form.password ? " auth-input--error" : ""}`}
                  placeholder="Re-enter password…"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" />Creating Account…</>
              ) : (
                "Create My Account →"
              )}
            </button>

            <p className="auth-terms">
              By creating an account, you agree to receive updates about our devotional products and seva offerings.
            </p>
          </form>

          <div className="auth-divider">or</div>
          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
