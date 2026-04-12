"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession, setAuthSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

type AuthMode = "register" | "login";

const initialRegisterForm = {
  name: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

type HomeAuthCardProps = {
  initialMode: AuthMode;
};

export default function HomeAuthCard({ initialMode }: HomeAuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    router.replace(nextMode === "login" ? "/?mode=login" : "/");
    resetFeedback();
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      setError("All fields are required.");
      return;
    }

    if (registerForm.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      clearAuthSession();
      setMessage("Account created. You can sign in now.");
      setLoginForm((current) => ({
        ...current,
        email: registerForm.email.trim(),
      }));
      setRegisterForm(initialRegisterForm);
      setMode("login");
      router.replace("/?mode=login");
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : "Registration failed.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setAuthSession(data.token, data.user);
      router.push("/dashboard");
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : "Login failed.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.9)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7">
      <div className="relative grid grid-cols-2 rounded-full bg-stone-100 p-1.5">
        <div
          className={`absolute inset-y-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white shadow-sm transition-all duration-300 ease-out ${
            mode === "register" ? "left-1.5" : "left-[calc(50%+0.125rem)]"
          }`}
        />
        <button
          type="button"
          onClick={() => handleModeChange("register")}
          className={`relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            mode === "register" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("login")}
          className={`relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            mode === "login" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Login
        </button>
      </div>

      <div className="mt-7 transition-all duration-300 ease-out">
        <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
          {mode === "register" ? "Create account" : "Welcome back"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {mode === "register"
            ? "Create your account and start working from one place."
            : "Sign in to continue inside your workspace."}
        </p>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {mode === "register" ? (
        <form onSubmit={handleRegister} className="mt-6 space-y-4 transition-all duration-300 ease-out">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Name</label>
            <input
              type="text"
              autoComplete="name"
              value={registerForm.name}
              onChange={(event) => {
                resetFeedback();
                setRegisterForm((current) => ({
                  ...current,
                  name: event.target.value,
                }));
              }}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={registerForm.email}
              onChange={(event) => {
                resetFeedback();
                setRegisterForm((current) => ({
                  ...current,
                  email: event.target.value,
                }));
              }}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={registerForm.password}
              onChange={(event) => {
                resetFeedback();
                setRegisterForm((current) => ({
                  ...current,
                  password: event.target.value,
                }));
              }}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]"
              placeholder="Create a password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--primary)] px-6 py-3.5 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="mt-6 space-y-4 transition-all duration-300 ease-out">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(event) => {
                resetFeedback();
                setLoginForm((current) => ({
                  ...current,
                  email: event.target.value,
                }));
              }}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-800">Password</label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-sm font-medium text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => {
                resetFeedback();
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }));
              }}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--primary)] px-6 py-3.5 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "register" ? "Already have an account?" : "Need a new account?"}{" "}
        <button
          type="button"
          onClick={() => handleModeChange(mode === "register" ? "login" : "register")}
          className="font-semibold text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
        >
          {mode === "register" ? "Use login" : "Register here"}
        </button>
      </p>
    </div>
  );
}
