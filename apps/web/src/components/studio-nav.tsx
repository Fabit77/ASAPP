"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Disc3,
  Layers,
  Users,
  ChartNoAxesColumn,
  Building2,
  UserRoundPlus,
  Settings2,
} from "lucide-react";
export function StudioNav() {
  const pathname = usePathname();
  return (
    <nav className="studio-nav" aria-label="Studio">
      {[
        { href: "/studio", label: "Inicio", icon: LayoutDashboard },
        { href: "/studio/drops", label: "Asados", icon: Disc3 },
        { href: "/studio/collections", label: "Colecciones", icon: Layers },
        { href: "/studio/collectors", label: "Coleccionistas", icon: Users },
        {
          href: "/studio/analytics",
          label: "Estadísticas",
          icon: ChartNoAxesColumn,
        },
        {
          href: "/studio/organization",
          label: "Organización",
          icon: Building2,
        },
        { href: "/studio/team", label: "Equipo", icon: UserRoundPlus },
        { href: "/studio/settings", label: "Ajustes", icon: Settings2 },
      ].map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={
            (
              n.href === "/studio"
                ? pathname === n.href
                : pathname.startsWith(n.href)
            )
              ? "active"
              : ""
          }
        >
          <n.icon size={18} />
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
