"use server";

import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { syncQuitHeroCustomerWithoutBlocking } from "@/lib/quithero-customers";
import { setCustomerSession } from "@/lib/customer-session";

export type CustomerAccessState = { error?: string };

export async function accessCustomerAccount(
  _state: CustomerAccessState,
  formData: FormData,
): Promise<CustomerAccessState> {
  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };

  try {
    const customer = await syncQuitHeroCustomerWithoutBlocking({ email });
    await setCustomerSession({ id: customer?.id, email: customer?.email ?? email });
  } catch (error) {
    console.error("Customer session creation failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { error: "We could not connect to your account. Please try again." };
  }

  redirect("/account");
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signInWithFacebook() {
  await signIn("facebook", { redirectTo: "/account" });
}
