/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Logo from "./Logo";
import { CURRENCIES } from "../types";
import LucideIcon from "./LucideIcon";
import { GlassFilter } from "./GlassEffect";
import { useAuth } from "../context/AuthContext";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { login, register } = useAuth();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    if (isSignUp && !name) {
      setError("Please enter your name.");
      return;
    }

    try {
      if (isSignUp) {
        await register(auth, email, password);
      } else {
        await login(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 bg-gradient-to-br from-[#E0E7FF] to-[#F3E8FF] dark:from-[#0B1124] dark:to-[#070913]"
      id="login-screen-outer-container"
    >
      <GlassFilter />
      <div className="sm:mx-auto sm:w-full sm:max-w-md" id="login-header-section">
        <Logo size="lg" className="mx-auto" />
        <h2 className="mt-6 text-center text-3xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100" id="login-heading">
          Cashate
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 font-sans" id="login-subheading">
          Track your spending and save money easily.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-card-container">
        <div className="premium-card py-8 px-6 bg-white/70 dark:bg-[#161726]/80 border-slate-100/50 dark:border-white/5" id="login-inner-card">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100 dark:border-red-900/30" id="login-error-toast">
              <LucideIcon name="AlertCircle" size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div id="login-auth-step">
            <form onSubmit={handleAuthSubmit} className="space-y-4" id="login-form">
              {isSignUp && (
                <div id="signup-name-field">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1" htmlFor="signup-name">
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold"
                  />
                </div>
              )}

              <div id="login-email-field">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold"
                />
              </div>

              <div id="login-password-field">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                id="login-submit-button"
                className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm bg-accent-gradient hover-bg-accent-gradient accent-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 font-sans" id="login-toggle-text">
              {isSignUp ? "Already have an account? " : "New to Cashate? "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
                id="login-toggle-button"
              >
                {isSignUp ? "Sign In instead" : "Sign up now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
