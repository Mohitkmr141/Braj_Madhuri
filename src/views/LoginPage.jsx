"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import "./Auth.css";

export default function LoginPage() {
  const router = useRouter();

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) { setError("Please enter a valid email address."); return; }
    if (!form.password)        { setError("Please enter your password."); return; }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result.error) {
        // Map raw NextAuth error strings to friendly messages
        const errorMap = {
          "No user found with this email": "No account found with that email. Please sign up first.",
          "Invalid password": "Incorrect password. Please try again.",
          "Missing email or password": "Please enter your email and password.",
        };
        setError(errorMap[result.error] || "Invalid email or password. Please try again.");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
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
          Sign in to continue your journey with The Braj Madhuri&apos;s sacred collection of pooja essentials.
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

          <span className="auth-card__eyebrow">Shri Radhavallabho Jayati</span>
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

            {/* Forgot password placeholder - coming soon */}

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
