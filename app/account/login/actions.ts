"use server";

import { redirect } from "next/navigation";
import {
  createQuitHeroCustomer,
  findQuitHeroCustomerByEmail,
  isQuitHeroDuplicateError,
} from "@/lib/quithero-customers";
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
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer) return { error: "Email not existing." };
    await setCustomerSession({ id: customer.id, email: customer.email ?? email });
  } catch {
    return { error: "We could not connect to your account. Please try again." };
  }

  redirect("/account");
}

export async function registerCustomerAccount(
  _state: CustomerAccessState,
  formData: FormData,
): Promise<CustomerAccessState> {
  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };

  try {
    const customer = await createQuitHeroCustomer({ email });
    await setCustomerSession({ id: customer?.id, email: customer?.email ?? email });
  } catch (error) {
    if (isQuitHeroDuplicateError(error)) return { error: "Email already registered. Please log in." };
    return { error: "We could not create your account. Please try again." };
  }

  redirect("/account");
}
