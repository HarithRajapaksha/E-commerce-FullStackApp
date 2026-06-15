import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const path = req.nextUrl.pathname;

    // Restrict normal users from administrative routes
    if (
      (path.startsWith("/add-items") || path.startsWith("/edite-details")) &&
      role !== "admin" &&
      role !== "super_admin"
    ) {
      return NextResponse.redirect(new URL("/show-items", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/show-items/:path*",
    "/add-items/:path*",
    "/edite-details/:path*",
  ],
};
