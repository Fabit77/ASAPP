"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { chileInstant } from "@asapp/core";
import { DomainError, safeReturnPath, type Role } from "@asapp/core";
import {
  services,
  currentUser,
  requireUser,
  localDemo,
  supabase,
  appOrigin,
} from "./server";
export type ActionState = {
  error?: string;
  success?: string;
  sent?: boolean;
  email?: string;
  redirectTo?: string;
};
const text = (f: FormData, k: string) => String(f.get(k) ?? "");
function message(e: unknown) {
  if (e instanceof DomainError) return e.message;
  if (e instanceof z.ZodError)
    return e.issues[0]?.message ?? "Revisa los campos.";
  console.error(
    "ASAPP action failed",
    e instanceof Error ? e.message : "unknown",
  );
  return "No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.";
}
export async function loginAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  try {
    const email = z.email().parse(text(f, "email").trim().toLowerCase());
    const svc = await services();
    await svc.throttle("login:" + email, 5);
    await svc.throttle("login:global", 200);
    const { error } = await (
      await supabase()
    ).auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          appOrigin() +
          "/auth/callback?next=" +
          encodeURIComponent(safeReturnPath(text(f, "next"))),
      },
    });
    if (error)
      return {
        error:
          "No pudimos enviar el código. Espera un momento e inténtalo otra vez.",
      };
    return { sent: true, email };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function verifyOtpAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  try {
    const email = z.email().parse(text(f, "email"));
    const token = z
      .string()
      .regex(/^\d{6,8}$/)
      .parse(text(f, "token"));
    await (await services()).throttle("otp:" + email, 10);
    const { error } = await (
      await supabase()
    ).auth.verifyOtp({ email, token, type: "email" });
    if (error) return { error: "El código no es válido o ha expirado." };
  } catch (e) {
    return { error: message(e) };
  }
  redirect(safeReturnPath(text(f, "next")));
}
export async function demoAction(f: FormData) {
  if (!localDemo()) throw new Error("Development access disabled.");
  const id =
    text(f, "persona") === "new"
      ? "10000000-0000-4000-8000-000000000020"
      : "10000000-0000-4000-8000-000000000001";
  await services();
  (await cookies()).set("asapp_demo", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  redirect(safeReturnPath(text(f, "next")));
}
export async function logoutAction() {
  if (localDemo()) (await cookies()).delete("asapp_demo");
  else await (await supabase()).auth.signOut();
  redirect("/");
}
export async function claimAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  try {
    const svc = await services();
    await svc.claimService.claimDrop(
      user.id,
      text(f, "type") === "SECRET_WORD"
        ? { type: "SECRET_WORD", slug: text(f, "slug"), word: text(f, "word") }
        : { type: "QR", code: text(f, "code") },
    );
    revalidatePath("/collection");
    return { success: "Ya es tuyo." };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function organizationAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  let org;
  try {
    org = await (
      await services()
    ).organizationService.create(user.id, {
      name: text(f, "name"),
      description: text(f, "description"),
    });
    (await cookies()).set("asapp_org", org.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/studio");
  redirect("/studio");
}
export async function selectOrg(f: FormData) {
  const user = await requireUser("/studio");
  const orgId = text(f, "organizationId");
  await (await services()).organizationService.permission(user.id, orgId);
  (await cookies()).set("asapp_org", orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/studio");
  redirect("/studio");
}
export async function dropAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  let dropId;
  try {
    const svc = await services();
    dropId = await svc.dropService.createDrop(
      user.id,
      {
        organizationId: text(f, "organizationId"),
        collectionId: text(f, "collectionId"),
        title: text(f, "title"),
        description: text(f, "description"),
        artworkUrl: text(f, "artworkUrl"),
        date: text(f, "date"),
        startDateTime: chileInstant(text(f, "date"), text(f, "startTime")),
        endDateTime: chileInstant(text(f, "date"), text(f, "endTime")),
        venueName: text(f, "venueName"),
        city: text(f, "city"),
        country: text(f, "country"),
        maxSupply: text(f, "maxSupply") ? Number(text(f, "maxSupply")) : null,
        visibility: text(f, "visibility"),
        status: text(f, "status"),
        qr: f.get("qr") === "on",
        secretWord: text(f, "secretWord"),
        secretEnabled: f.get("secretEnabled") === "on",
      },
      text(f, "id") || undefined,
    );
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/studio");
  revalidatePath("/explore");
  redirect("/studio/drops/" + dropId);
}
export async function manageDropAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  let dropId;
  try {
    const action = z
      .enum(["pause", "resume", "archive", "duplicate", "publish"])
      .parse(text(f, "operation"));
    dropId = await (
      await services()
    ).dropService.manage(user.id, text(f, "id"), action);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/studio");
  redirect("/studio/drops/" + dropId);
}
export async function saveCollectionAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  try {
    const svc = await services();
    await svc.collectionService.save(user.id, {
      id: text(f, "id") || undefined,
      organizationId: text(f, "organizationId"),
      name: text(f, "name"),
      description: text(f, "description"),
    });
    if (text(f, "order"))
      await svc.collectionService.reorder(
        user.id,
        text(f, "organizationId"),
        text(f, "id"),
        text(f, "order").split(",").filter(Boolean),
      );
    revalidatePath("/studio/collections");
    return { success: "Colección guardada." };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function profileAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/profile");
  try {
    await (
      await services()
    ).userService.update(user.id, {
      displayName: text(f, "displayName"),
      username: text(f, "username"),
      bio: text(f, "bio"),
      city: text(f, "city"),
      isPublic: f.get("isPublic") === "on",
    });
    revalidatePath("/profile");
    revalidatePath("/u");
    return { success: "Perfil actualizado." };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function organizationSettingsAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  try {
    await (
      await services()
    ).organizationService.update(
      user.id,
      text(f, "organizationId"),
      text(f, "name"),
      text(f, "description"),
    );
    revalidatePath("/studio");
    return { success: "Organización actualizada." };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function teamAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const user = await requireUser("/studio");
  try {
    await (
      await services()
    ).organizationService.setMember(
      user.id,
      text(f, "organizationId"),
      text(f, "email"),
      text(f, "role") as Role,
    );
    revalidatePath("/studio/team");
    return { success: "Permisos actualizados." };
  } catch (e) {
    return { error: message(e) };
  }
}
