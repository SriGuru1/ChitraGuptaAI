import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";

import { useAuth } from "../context/AuthContext";

type Role = "teacher" | "student";

export default function AuthCard() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("teacher");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ ...form });
      } else {
        await register({ ...form, role });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as { detail?: string })?.detail ?? err.message;
        setError(detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Authentication failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign Up
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            type="email"
            required
            placeholder="you@school.edu"
          />
        </label>
        <label>
          Password
          <input
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
          />
        </label>
        <div className="role-select">
          <label className="radio-label">
            <input
              type="radio"
              checked={role === "teacher"}
              onChange={() => setRole("teacher")}
            />
            Teacher
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={role === "student"}
              onChange={() => setRole("student")}
            />
            Student
          </label>
        </div>
        {error && <p className="error" style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
        <button className="submit-btn" disabled={loading} type="submit">
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}

