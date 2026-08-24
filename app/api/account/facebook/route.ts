import { signIn } from "@/auth";

export async function GET() {
  return signIn("facebook", { redirectTo: "/account/auth-popup" });
}
