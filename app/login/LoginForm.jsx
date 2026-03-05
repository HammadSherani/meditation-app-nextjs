/* eslint-disable react/no-unescaped-entities */
// app/login/LoginForm.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" 
          ? "Invalid email or password" 
          : res.error
        );
        setLoading(false);
        return;
      }

      router.replace(callbackUrl);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  // Already authenticated
  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Welcome</h1>
          <p className="text-zinc-400 mt-2">Sign in to your account</p>
        </div>

        {registered && (
          <div className="mb-4 text-sm text-green-400 bg-green-400/10 border border-green-400/20 p-3 rounded-lg">
            Account created successfully! Please sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <Link href="/forgot" className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 pl-10 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-zinc-600"
                required
              />
            </div>
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
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue"}
          </Button>

          <p className="text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-400 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}