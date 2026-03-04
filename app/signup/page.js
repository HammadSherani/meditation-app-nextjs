"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Create the account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // Step 2: Auto-login after successful signup
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        // Account created but auto-login failed, redirect to login
        router.push("/login?registered=true");
        return;
      }

      // Logged in successfully - go to home
      router.replace("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 selection:bg-indigo-500/30">
    

      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Create Account</h1>
          <p className="text-zinc-400 mt-2">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Khan"
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 pl-10 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@example.com"
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 pl-10 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 pl-10 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-zinc-600"
                required
              />
            </div>
            <p className="text-xs text-zinc-500">Must be at least 6 characters</p>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full" /> {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 transition-all"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Create Account"}
          </Button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
