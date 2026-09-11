import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { DomainError, type Role } from "./types";
const scrypt = promisify(scryptCallback);
export const generateClaimCode = () => randomBytes(24).toString("base64url");
const normalize = (word: string) =>
  word.normalize("NFKC").trim().toLocaleLowerCase("es");
export async function hashSecret(word: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(normalize(word), salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifySecret(word: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !hash || word.length > 200)
    return false;
  const actual = (await scrypt(normalize(word), salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function assertRole(role: Role | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role))
    throw new DomainError(
      "FORBIDDEN",
      "No tienes permiso para realizar esta acción.",
    );
}
export function safeReturnPath(value: unknown) {
  return typeof value === "string" &&
    /^\/(?!\/)/.test(value) &&
    !/[\\\r\n]/.test(value)
    ? value
    : "/collection";
}
