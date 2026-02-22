// middleware.js
import { auth } from "./lib/auth";

// Auth.js v5 mein aap directly auth ko export default karte hain
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Agar user logged in nahi hai aur protected page pe hai
  if (!isLoggedIn && nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  // Un pages ko ignore karein jo static hain ya api routes hain
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};