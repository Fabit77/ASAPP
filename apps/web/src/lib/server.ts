import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { getDatabase, isLocalDemo } from "@asapp/database";
import { createServices, safeReturnPath } from "@asapp/core";
export const services = cache(async () => createServices(await getDatabase()));
export const localDemo = isLocalDemo;
export async function supabase() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Configura Supabase para iniciar sesión.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server Components cannot set cookies; proxy refreshes them. */
        }
      },
    },
  });
}
export const currentUser = cache(async () => {
  if (localDemo()) {
    const value = (await cookies()).get("asapp_demo")?.value;
    if (
      ![
        "10000000-0000-4000-8000-000000000001",
        "10000000-0000-4000-8000-000000000020",
      ].includes(value ?? "")
    )
      return null;
    return (await services()).userService.get(value!);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const {
    data: { user },
  } = await (await supabase()).auth.getUser();
  if (!user?.email) return null;
  return (await services()).userService.syncUser({
    id: user.id,
    email: user.email,
  });
});
export async function requireUser(next = "/collection") {
  const user = await currentUser();
  if (!user)
    redirect("/login?next=" + encodeURIComponent(safeReturnPath(next)));
  return user;
}
export async function studioContext() {
  const user = await requireUser("/studio");
  const svc = await services();
  const orgs = await svc.organizationService.list(user.id);
  const selected = (await cookies()).get("asapp_org")?.value;
  const org = orgs.find((o) => o.id === selected) ?? orgs[0] ?? null;
  return { user, org, orgs, svc };
}
export const appOrigin = () => {
  const origin =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return new URL(origin).origin;
};
