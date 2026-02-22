// app/login/page.js
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Login ke baad kahan jana hai
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-4">
      <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border p-2" />
      <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="border p-2" />
      <button type="submit" className="bg-blue-500 text-white p-2">Login</button>
    </form>
  );
}