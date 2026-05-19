import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/newsletter-form";

export function Footer() {
  return ( 
    <footer className="bg-cover bg-center bg-no-repeat text-white" style={{ backgroundImage: "url('/images/background-footer-header.png')" }}>

      {/* Main footer — Logo | Nav | Newsletter */}
      <div className="px-10 py-16 lg:px-20 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 lg:gap-16">

          {/* Left: Logo */}
          <div className="flex items-center justify-center sm:items-start sm:justify-start">
            <div className="relative h-[180px] w-[220px]">
              <Image
                src="/images/footerprueba.png"
                alt="Centro Márgenes"
                fill
                className="object-contain object-center sm:object-left"
              />
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="flex flex-col items-center sm:items-start justify-center">
            <nav className="flex flex-col items-center sm:items-start gap-3">
              {[
                { href: "/nuestro-trabajo", label: "Nuestro trabajo" },
                { href: "/terapeutas", label: "Terapeutas" },
                { href: "/reservar", label: "Reservar cita" },
                { href: "/blog", label: "Blog" },
                { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Newsletter */}
          <div className="flex flex-col items-center sm:items-start justify-center text-center sm:text-left">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Suscríbete
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Recibe reflexiones y contenidos que compartimos periódicamente.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
            {/* Social */}
            <div className="mt-8 flex items-center justify-center sm:justify-start gap-5">
              <a href="https://instagram.com/centro.margenes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/60 transition-colors hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/60 transition-colors hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white/60 transition-colors hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.2 8.2 0 0 0 4.76 1.52V6.79a4.83 4.83 0 0 1-1-.1z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-10 py-6 lg:px-20">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            © {new Date().getFullYear()} Centro Márgenes. Todos los derechos reservados.
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            contacto@centromargenes.cl · Santiago, Chile
          </p>
        </div>
      </div>
    </footer>
  );
}
