import { signIn } from "@/auth";

export async function GET() {
  await signIn("google", {
    redirectTo: "/account/auth-popup",
  });
}
