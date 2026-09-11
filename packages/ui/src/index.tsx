import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
export function Artwork({
  src,
  title,
  size = "normal",
}: {
  src: string;
  title: string;
  size?: "normal" | "large" | "small";
}) {
  return (
    <div className={`artwork artwork-${size}`}>
      <Image src={src} alt={title} width={1080} height={1080} unoptimized />
    </div>
  );
}
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="ASAPP Inicio">
      asapp<span>®</span>
    </Link>
  );
}
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`button ${secondary ? "button-secondary" : ""}`}
      href={href}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title = "Tu colección parte con un asado.",
  description = "Escanea un QR en tu próximo asado para empezar.",
  href = "/explore",
  cta = "Explorar asados",
}: {
  title?: string;
  description?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-orbit">
        <Plus size={36} />
      </div>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <Link className="text-link" href={href}>
        {cta}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
