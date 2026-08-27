import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { syncQuitHeroCustomerWithoutBlocking } from "@/lib/quithero-customers";
import { CUSTOMER_SESSION_COOKIE, verifySignedCustomerSession } from "@/lib/customer-session";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined),
  providers: [Google, Facebook],
  pages: { signIn: "/account/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account || !["google", "facebook"].includes(account.provider)) {
        return false;
      }

      const [firstName, ...lastNameParts] = (user.name ?? "").trim().split(/\s+/);
      await syncQuitHeroCustomerWithoutBlocking({
        email: user.email,
        firstName: firstName || undefined,
        lastName: lastNameParts.join(" ") || undefined,
      });
      return true;
    },
    authorized({ auth: session, request }) {
      const isLoginPage = request.nextUrl.pathname === "/account/login";
      if (isLoginPage) return true;
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (
          process.env.NODE_ENV !== "production" &&
          process.env.QUITHERO_DASHBOARD_DEV_BYPASS === "true"
        ) {
          return true;
        }
        const staffEmails = (process.env.QUITHERO_STAFF_EMAILS ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean);
        return Boolean(
          session?.user?.email &&
          staffEmails.includes(session.user.email.toLowerCase()),
        );
      }
      const emailSession = verifySignedCustomerSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
      return Boolean(session?.user?.email || emailSession?.email);
    },
  },
});
