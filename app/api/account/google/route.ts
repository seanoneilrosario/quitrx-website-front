import { signIn } from "@/auth";

export async function GET() {
  return signIn("google", { redirectTo: "/account/auth-popup" });
}
