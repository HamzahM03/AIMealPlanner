// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // where to send users who aren’t logged in
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",   // protect these paths
    "/account/:path*",
    "/settings/:path*",
  ],
};
