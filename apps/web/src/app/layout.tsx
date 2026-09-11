import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { currentUser, localDemo } from "@/lib/server";
import "./globals.css";
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "ASAPP — Cada asado cuenta.", template: "%s · ASAPP" },
  description:
    "Colecciona los asados que viviste. Cada asado tiene una historia. Guarda los que viviste y construye tu colección.",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="es">
      <body className={manrope.variable}>
        {localDemo() && (
          <div className="demo-banner">
            {process.env.ASAPP_HOSTED_DEMO === "true"
              ? "Demo pública · los cambios pueden reiniciarse"
              : "Vista de desarrollo · datos de ejemplo"}
          </div>
        )}
        <Navigation signedIn={!!user} />
        {children}
        <footer className="site-footer">
          <span>asapp®</span>
          <p>Los asados pasan. Los recuerdos quedan.</p>
          <small>Hecho para estar juntos.</small>
        </footer>
      </body>
    </html>
  );
}
