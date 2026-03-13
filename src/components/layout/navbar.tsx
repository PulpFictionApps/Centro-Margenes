"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const leftLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nuestro-trabajo", label: "Nuestro trabajo" },
  { href: "/blog", label: "Blog" },
];

const rightLinks = [
  { href: "/formacion", label: "Formación" },
  { href: "/convenios", label: "Convenios" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70" style={{ backgroundImage: "url('/images/background-footer-header.png')" }} />
      <div className="relative flex h-[5.9rem] items-center justify-between px-8">
        {/* Left nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {leftLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-[2px] text-[#EDE6CA] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/images/V4.png"
            alt="Centro Márgenes"
            width={290}
            height={50}
            className="h-15 w-160"
            priority
          />
        </Link>

        {/* Right nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {rightLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-[2px] text-[#EDE6CA] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/reservar">
            <span className="inline-block rounded bg-brand px-5 py-2 text-[11px] font-medium uppercase tracking-[2px] text-white transition-colors hover:bg-brand-light">
              Reserva
            </span>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="ml-auto md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5 text-[#EDE6CA]" /> : <Menu className="h-5 w-5 text-[#EDE6CA]" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-neutral-300/40 px-8 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {[...leftLinks, ...rightLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium uppercase tracking-[2px] text-[#EDE6CA] transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/reservar" onClick={() => setMobileOpen(false)}>
              <span className="block rounded bg-brand px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[2px] text-white">
                Reserva
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
