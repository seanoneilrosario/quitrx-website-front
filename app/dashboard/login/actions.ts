"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type StaffLoginState = { error?: string };

export async function loginStaff(
  _state: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your staff email and password." };

  try {
    await signIn("staff-credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid staff email or password." };
    }
    throw error;
  }
}

