import { signIn } from "@/auth";

export async function GET() {
  await signIn("facebook", {
    redirectTo: "/account/auth-popup",
  });
}
