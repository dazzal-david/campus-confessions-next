"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !password2) {
      setError("Please fill in all fields");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username: 3-20 chars, letters/numbers/underscores");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg shadow-rose-500/10 border border-rose-200">
      <h1 className="text-3xl text-center mb-1 gradient-text">
        Join the Confession
      </h1>
      <p className="text-center text-warm-800/60 text-sm mb-6">
        Stay anonymous, speak your heart
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-warm-800/60 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pick_a_name"
            autoComplete="username"
            autoFocus
            className="w-full px-3.5 py-2.5 border-[1.5px] border-rose-200 rounded-xl text-sm outline-none focus:border-rose-500 bg-warm-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-warm-800/60 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6+ characters"
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-rose-200 rounded-xl text-sm outline-none focus:border-rose-500 bg-warm-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-warm-800/60 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="type it again"
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-rose-200 rounded-xl text-sm outline-none focus:border-rose-500 bg-warm-50 focus:bg-white transition-colors"
          />
        </div>
        {error && (
          <p className="text-red-500 text-xs text-center mb-2.5">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 gradient-bg text-white rounded-xl font-bold text-sm cursor-pointer shadow-md shadow-rose-500/30 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-warm-800/60">
        Already have an account?{" "}
        <Link href="/login" className="text-rose-500 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
