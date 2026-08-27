import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { syncQuitHeroCustomerWithoutBlocking } from "@/lib/quithero-customers";
import { CUSTOMER_SESSION_COOKIE, verifySignedCustomerSession } from "@/lib/customer-session";

type StaffIdentity = {
  id: string;
  email: string;
  name?: string;
  staffAccessToken: string;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined),
  providers: [
    Credentials({
      id: "staff-credentials",
      name: "QuitHero staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = stringValue(credentials.email);
        const password = stringValue(credentials.password);
        if (!email || !password) return null;

        const apiBase = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");
        const response = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        });
        if (!response.ok) return null;

        const payload = objectValue(await response.json());
        const data = objectValue(payload.data);
        const staff = objectValue(payload.staff ?? payload.user ?? data.staff ?? data.user);
        const accessToken = stringValue(
          payload.accessToken ?? payload.access_token ?? payload.token ??
          data.accessToken ?? data.access_token ?? data.token,
        );
        if (!accessToken) return null;

        return {
          id: stringValue(staff.id) ?? stringValue(payload.id) ?? email,
          email: stringValue(staff.email) ?? email,
          name: stringValue(staff.name) ?? stringValue(staff.fullName) ?? email,
          staffAccessToken: accessToken,
        } satisfies StaffIdentity;
      },
    }),
    Google,
    Facebook,
  ],
  pages: { signIn: "/account/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "staff-credentials") return true;
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
    jwt({ token, user, account }) {
      if (account?.provider === "staff-credentials" && user) {
        const staff = user as typeof user & { staffAccessToken?: string };
        token.staffAccessToken = staff.staffAccessToken;
        token.isStaff = Boolean(staff.staffAccessToken);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { isStaff?: boolean }).isStaff = token.isStaff === true;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname === "/account/login" || pathname === "/dashboard/login") return true;
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (
          process.env.NODE_ENV !== "production" &&
          process.env.QUITHERO_DASHBOARD_DEV_BYPASS === "true"
        ) {
          return true;
        }
        const isStaff = Boolean(
          session?.user &&
          (session.user as typeof session.user & { isStaff?: boolean }).isStaff,
        );
        if (isStaff) return true;
        return Response.redirect(new URL("/dashboard/login", request.nextUrl));
      }
      const emailSession = verifySignedCustomerSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
      return Boolean(session?.user?.email || emailSession?.email);
    },
  },
});
