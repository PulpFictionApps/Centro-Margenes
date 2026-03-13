import Image from "next/image";
import Link from "next/link";

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#EDE6CA]">
        <div className="relative z-10 mx-auto max-w-[800px] px-6 py-24 text-center lg:py-32">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Quiénes somos
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            Centro Márgenes
          </h1>
          <p className="mt-8 text-sm leading-[1.9] text-neutral-500">
            Un espacio de terapia relacional y creativa donde la conexión humana auténtica
            se convierte en el vehículo del cambio. Aquí, cada historia es bienvenida en su totalidad.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#5b2525] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">
            <div className="flex-1">
              <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-white/60">
                Nuestra misión
              </h3>
              <h2 className="mt-6 font-playfair text-3xl font-normal text-white lg:text-5xl">
                Acompañar desde
                <br />
                la profundidad
              </h2>
              <p className="mt-8 max-w-[500px] text-sm leading-[1.9] text-white/80">
                En Centro Márgenes creemos que el bienestar emocional nace de la comprensión profunda.
                Nuestra misión es ofrecer un espacio seguro y genuino donde cada persona pueda explorar
                su historia, reconectar con su sabiduría interior and y transformar patrones que ya no sirven,
                a través de un enfoque que entrelaza la clínica con la creatividad.
              </p>
            </div>
            <div className="relative aspect-[3/4] w-full max-w-[400px] flex-shrink-0 overflow-hidden">
              <Image
                src="/images/secccion3.jpg"
                alt="Centro Márgenes espacio"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#EDE6CA] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
              EL PROCESO
            </h3>
            <h2 className="mt-6 font-playfair text-4xl font-normal text-brand lg:text-5xl">
               TERAPÉUTICO
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Empatía",
                description:
                  "Nos ponemos en tu lugar. Escuchamos activamente y comprendemos tu experiencia sin juzgar.",
              },
              {
                title: "Compromiso",
                description:
                  "Estamos comprometidos con tu proceso terapéutico y tu crecimiento personal a largo plazo.",
              },
              {
                title: "Transparencia",
                description:
                  "Comunicación honesta y clara sobre el proceso terapéutico, metodologías y expectativas.",
              },
              {
                title: "Inclusión",
                description:
                  "Un espacio abierto y respetuoso para todas las personas, sin importar su origen o identidad.",
              },
            ].map((value, i) => (
              <div
                key={value.title}
                className="border-t border-neutral-300/60 px-6 py-10 lg:border-l lg:border-t-0 lg:first:border-l-0"
              >
                <span className="text-[11px] font-light italic text-neutral-400">
                  0{i + 1}/
                </span>
                <h4 className="mt-4 font-playfair text-xl font-normal text-brand">
                  {value.title}
                </h4>
                <p className="mt-4 text-sm leading-[1.8] text-neutral-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row">
            <div className="flex-1">
              <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
                Cómo trabajamos
              </h3>
              <h2 className="mt-6 font-playfair text-4xl font-normal text-brand lg:text-5xl">
                Nuestro enfoque
              </h2>
              <p className="mt-8 max-w-[500px] text-sm leading-[1.9] text-neutral-500">
                Trabajamos desde un modelo integrativo que combina diferentes corrientes
                psicológicas según las necesidades de cada persona. Nuestro enfoque relacional
                y creativo permite acceder a capas más profundas del ser.
              </p>
            </div>

            <div className="flex-1">
              <div className="space-y-0">
                {[
                  "Terapia cognitivo-conductual",
                  "Psicoterapia humanista",
                  "Terapia sistémica",
                  "Mindfulness y ACT",
                  "Terapia breve estratégica",
                  "Enfoque psicodinámico",
                ].map((approach, i) => (
                  <div
                    key={approach}
                    className="flex items-baseline gap-4 border-b border-neutral-200 py-5"
                  >
                    <span className="text-[11px] font-light italic text-neutral-400">
                      0{i + 1}/
                    </span>
                    <span className="text-sm font-normal text-neutral-700">
                      {approach}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote / CTA Divider */}
      <section className="relative flex h-[400px] items-center justify-center overflow-hidden lg:h-[500px]">
        <Image
          src="/images/imagendivi.jpg"
          alt="Centro Márgenes"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto max-w-[700px] px-6 text-center">
          <p className="font-playfair text-xl font-normal italic leading-relaxed text-white lg:text-2xl">
            &ldquo;No se trata solo de resolver problemas, sino de descubrir
            nuevas formas de relacionarte contigo mismo y con los demás.&rdquo;
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-white/60">
            — Equipo Centro Márgenes
          </p>
          <div className="mt-10">
            <Link
              href="/reservar"
              className="btn-fill btn-fill-white inline-block border-y border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-white transition-all duration-300"
            >
              Comenzar el camino
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
