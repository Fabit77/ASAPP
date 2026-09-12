"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, Compass, UserRound, Plus } from "lucide-react";
import { Logo } from "@asapp/ui";
export function Navigation({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) return null;
  const nav = [
    { href: "/explore", label: "Explorar", icon: Compass },
    { href: "/collection", label: "Mi colección", icon: Disc3 },
    { href: "/profile", label: "Perfil", icon: UserRound },
  ];
  return (
    <>
      <header className="topbar">
        <Logo />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {nav.slice(0, 2).map((n) => (
            <Link
              className={pathname === n.href ? "active" : ""}
              key={n.href}
              href={n.href}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          <Link className="studio-link" href="/studio">
            <Plus size={15} /> Crear coleccionable
          </Link>
          <Link
            className="avatar"
            href={signedIn ? "/profile" : "/login"}
            aria-label={signedIn ? "Mi perfil" : "Iniciar sesión"}
          >
            <UserRound size={19} />
          </Link>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {nav.slice(0, 2).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={pathname === n.href ? "active" : ""}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </Link>
        ))}
        <Link
          href="/studio"
          className="bottom-nav__creator"
          aria-label="Abrir Creator Studio"
        >
          <Plus size={22} />
          <span>Crear</span>
        </Link>
        <Link
          href="/profile"
          className={pathname === "/profile" ? "active" : ""}
        >
          <UserRound size={21} />
          <span>Perfil</span>
        </Link>
      </nav>
    </>
  );
}
