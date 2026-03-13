"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <>
      {!isDashboard && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!isDashboard && <Footer />}
    </>
  );
}
