import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LayoutShell } from "@/components/layout/layout-shell";

const leggibilmente = localFont({
  src: [
    {
      path: "./fonts/Leggibilmente-RegularRoman.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-leggibilmente",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Centro Márgenes | Centro de Atención Psicológica",
  description:
    "Centro de atención psicológica dedicado a tu bienestar emocional. Reserva tu cita con nuestros especialistas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${leggibilmente.variable} ${playfair.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
