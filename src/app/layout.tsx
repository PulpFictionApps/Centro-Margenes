import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LayoutShell } from "@/components/layout/layout-shell";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL("https://centromargenes.cl"),
  title: {
    default: "Centro Márgenes | Psicólogos en Providencia · Santiago",
    template: "%s | Centro Márgenes",
  },
  description:
    "Centro de atención psicológica psicoanalítica en Providencia, Santiago. Atención individual online y presencial. Especialistas en psicoanálisis. Convenios disponibles. Agenda tu cita.",
  keywords: [
    "psicólogo Providencia",
    "psicólogo Santiago",
    "psicólogo online Chile",
    "centro psicológico Providencia",
    "terapia psicoanalítica Santiago",
    "psicoanálisis Chile",
    "psicoanálisis lacaniano",
    "atención psicológica online",
    "psicólogo convenio",
    "salud mental Santiago",
    "consulta psicológica online",
    "terapia online Santiago",
    "Centro Márgenes",
  ],
  authors: [{ name: "Centro Márgenes", url: "https://centromargenes.cl" }],
  creator: "Centro Márgenes",
  publisher: "Centro Márgenes",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://centromargenes.cl",
    siteName: "Centro Márgenes",
    title: "Centro Márgenes | Psicólogos en Providencia · Santiago",
    description:
      "Centro de atención psicológica psicoanalítica en Providencia, Santiago. Atención online y presencial. Convenios disponibles.",
    images: [
      {
        url: "/images/Imagotipo1.png",
        width: 512,
        height: 512,
        alt: "Centro Márgenes - Centro de Atención Psicológica",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Centro Márgenes | Psicólogos en Providencia · Santiago",
    description:
      "Centro de atención psicológica psicoanalítica en Providencia, Santiago. Atención online y presencial.",
    images: ["/images/Imagotipo1.png"],
  },
  alternates: {
    canonical: "https://centromargenes.cl",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/IconosMargenes/favicon.ico", sizes: "any" },
      { url: "/IconosMargenes/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/IconosMargenes/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/IconosMargenes/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/IconosMargenes/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/IconosMargenes/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/IconosMargenes/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/IconosMargenes/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/IconosMargenes/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/IconosMargenes/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/IconosMargenes/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/IconosMargenes/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/IconosMargenes/apple-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      { rel: "msapplication-config", url: "/IconosMargenes/browserconfig.xml" },
    ],
  },
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
        <LocalBusinessJsonLd />
        <LayoutShell>{children}</LayoutShell>
        <ServiceWorkerRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}
