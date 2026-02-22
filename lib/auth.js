// lib/auth.js
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // Simple check for testing
        if (credentials.email === "admin@test.com" && credentials.password === "123") {
          return { id: "1", name: "Admin", email: "admin@test.com" };
        }
        return null;
      },
    }),
  ],
  // Credentials ke liye JWT strategy lazmi hai
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Edge runtime compatibility ke liye
  trustHost: true,
});