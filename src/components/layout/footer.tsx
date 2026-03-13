import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";

export function Footer() {
  return (
    <footer className="bg-cover bg-center bg-no-repeat text-white" style={{ backgroundImage: "url('/images/background-footer-header.png')" }}>
      {/* Newsletter band */}
      <div className="border-b border-white/10 px-6 py-16 lg:py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <div className="text-center lg:text-left">
            <h3 className="font-playfair text-2xl font-normal text-white lg:text-3xl">
              MANTENGÁMONOS EN CONTACTO
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Puedes suscribirte para recibir reflexiones y contenidos que compartimos periódicamente.
            </p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span className="text-sm font-medium uppercase tracking-[3px] text-white">
              Centro Márgenes
            </span>
            <p className="mt-6 max-w-[260px] text-sm leading-[1.8] text-white/50">
              Un espacio para el trabajo profundo, donde tu ser completo es bienvenido.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-white/40">
              Navegación
            </h4>
            <nav className="mt-6 flex flex-col gap-3">
              {[
                { href: "/", label: "Inicio" },
                { href: "/nosotros", label: "Nosotros" },
                { href: "/terapeutas", label: "Terapeutas" },
                { href: "/reservar", label: "Reservar cita" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-white/40">
              Contacto
            </h4>
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/60">
              <span>+56 9 1234 5678</span>
              <span>contacto@centromargenes.cl</span>
              <span>Santiago, Chile</span>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-white/40">
              Horario
            </h4>
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/60">
              <span>Lunes a Viernes: 9:00 – 20:00</span>
              <span>Sábado: 9:00 – 14:00</span>
              <span>Domingo: Cerrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/30">
            © {new Date().getFullYear()} Centro Márgenes. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-[11px] uppercase tracking-[0.15em] text-white/30 transition-colors hover:text-white/60"
            >
              Acceso terapeutas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
