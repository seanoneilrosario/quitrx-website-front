import { signIn } from "@/auth";

export async function GET(request: Request) {
  console.log("[OAuth Debug] Facebook route hit", {
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    accept: request.headers.get("accept"),
  });

  await signIn("facebook", {
    redirectTo: "/account/auth-popup",
  });
}