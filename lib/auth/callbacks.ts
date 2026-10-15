import type { NextAuthConfig } from "next-auth";
import {
  findQuitHeroCustomerByOAuth,
  linkQuitHeroCustomerOAuth,
  syncQuitHeroCustomer,
} from "@/lib/quithero/customers";
import { CUSTOMER_SESSION_COOKIE, verifySignedCustomerSession } from "@/lib/auth/customer-session";

export const authCallbacks = {
  async signIn({ user, account }) {
    if (!account || !["google", "facebook"].includes(account.provider)) {
      return false;
    }

    const provider = account.provider as "facebook" | "google";
    const providerAccountId = account.providerAccountId;

    // First, check whether this OAuth account
    // is already linked to a QuitHero customer.
    if (providerAccountId) {
      const linkedCustomer = await findQuitHeroCustomerByOAuth(provider, providerAccountId);

      if (linkedCustomer?.email) {
        user.email = linkedCustomer.email;
        user.id = linkedCustomer.id;

        return true;
      }
    }

    // Create a QuitHero customer when a verified social login is new.
    if (user.email) {
      const customer = await syncQuitHeroCustomer(user);
      if (!customer?.id) return false;

      if (providerAccountId) {
        await linkQuitHeroCustomerOAuth(customer.id, provider, providerAccountId);

        user.id = customer.id;
      }

      return true;
    }

    // Facebook authenticated successfully, but didn't provide
    // an email and this account isn't linked yet.
    // The email collection step will be handled next.
    if (provider === "facebook") {
      return true;
    }

    return false;
  },

  async jwt({ token, user, account }) {
    if (user) {
      token.id = user.id;
    }
    if (account) {
      token.provider = account.provider;
      token.providerAccountId = account.providerAccountId;
      token.needsCustomerEmail = account.provider === "facebook" && !user?.email;
    }

    return token;
  },

  async session({ session, token }) {
    const userId = token.id ?? token.sub;
    if (session.user && typeof userId === "string") {
      session.user.id = userId;
    }
    session.user.provider = typeof token.provider === "string" ? token.provider : undefined;
    session.user.providerAccountId =
      typeof token.providerAccountId === "string" ? token.providerAccountId : undefined;
    session.user.needsCustomerEmail = token.needsCustomerEmail === true;

    return session;
  },

  async authorized({ auth: session, request }) {
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === "/account/login";

    if (isLoginPage) {
      return true;
    }
    if (pathname === "/account/auth-popup" && session?.user) return true;

    const emailSession = verifySignedCustomerSession(
      request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value,
    );
    const email = session?.user?.email ?? emailSession?.email;
    if (email) return true;
    return Response.redirect(new URL("/account/login", request.nextUrl));
  },
} satisfies NonNullable<NextAuthConfig["callbacks"]>;
