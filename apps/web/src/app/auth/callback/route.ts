import { NextResponse } from "next/server";
import { supabase, appOrigin } from "@/lib/server";
import { safeReturnPath } from "@asapp/core";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await (
      await supabase()
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        appOrigin() + safeReturnPath(url.searchParams.get("next")),
      );
  }
  return NextResponse.redirect(appOrigin() + "/login?error=expired");
}
