"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Disc3, Compass, UserRound, ArrowUpRight } from "lucide-react";
import { Logo } from "@asapp/ui";
export function Navigation({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) return null;
  const nav = [
    { href: "/", label: "Inicio", icon: House },
    { href: "/collection", label: "Colección", icon: Disc3 },
    { href: "/explore", label: "Explorar", icon: Compass },
    { href: "/profile", label: "Perfil", icon: UserRound },
  ];
  return (
    <>
      <header className="topbar">
        <Logo />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {nav.slice(0, 3).map((n) => (
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
            ASAPP Studio <ArrowUpRight size={15} />
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
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={pathname === n.href ? "active" : ""}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
