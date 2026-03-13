import Link from "next/link";
import Image from "next/image";
import { HeroSection } from "@/components/hero-section";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Intro */}
      <section className="relative flex min-h-[500px] items-center justify-center px-6 py-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/Bloque%20burdeo.png')" }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-playfair text-3xl font-normal text-white sm:text-4xl lg:text-5xl">
             LA TERAPIA PSICOANALÍTICA


          </h2>
          <p className="mt-8 text-sm font-semibold italic leading-relaxed text-white/90">En los márgenes se reescriben las historias</p>

          <p className="mt-6 text-sm leading-[1.8] text-white/80">
            Centro Márgenes es un espacio de atención clínica y de formación dedicado a la escucha y al trabajo con la singularidad de cada sujeto. Ofrecemos atención psicoanalítica y propuestas formativas que abren un lugar para pensar, cuestionar y crear nuevas lecturas.   La terapia psicoanalítica es un proceso de exploración del sujeto mediante la palabra, donde el paciente habla libremente y el analista escucha, interpreta y acompaña el proceso de producción de sentido. El psicoanálisis no es solo un conjunto de técnicas, sino una práctica interpretativa y ética basada en la escucha del inconsciente. Aquí cada proceso es singular y se construye respetando el ritmo y la historia de cada persona.
          </p>
          <div className="mt-10">
            <Link
              href="/nosotros"
              className="btn-fill btn-fill-white inline-block border-y border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-white transition-all duration-300"
            >
              Conocer más
            </Link>
          </div>
        </div>
      </section>

      {/* Services / Offerings */}
      <section className="bg-transparent">
        {/* ──── Top: Offerings ──── */}
        <div className="mx-auto max-w-[1200px] px-6 pt-24 lg:pt-32">
          <div className="relative">
            {/* Row: image + text side by side */}
            <div className="flex flex-col lg:flex-row lg:gap-12">
              {/* Left image */}
              <div className="relative aspect-[3/4] w-full max-w-[500px] flex-shrink-0 overflow-hidden">
                <Image
                  src="/images/El-proceso-terapéutico.png"
                  alt="Centro Márgenes"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Right text — pushed down so title has room */}
              <div className="mt-8 flex flex-col justify-end pb-4 lg:mt-0 lg:pb-0">
                <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-600">
                  Escuchar, decir y elaborar lo que produce malestar.
                </h3>
                <p className="mt-8 max-w-[420px] text-sm leading-[1.9] text-neutral-500">
                  La terapia es un espacio de encuentro y escucha donde aquello que genera malestar puede comenzar a ser hablado y pensado con mayor profundidad. 
                  A través del diálogo y la experiencia transferencial, 
                  el proceso permite comprender experiencias que se repiten, 
                  dar un lugar a emociones complejas y abrir nuevas formas de relacionarse con uno mismo y con los demás.<br></br><br></br>
                   Pensamos el proceso terapéutico como un lugar donde hablar libremente y explorar lo que aparece. Sin juicios ni respuestas predeterminadas, permitiendo que cada persona encuentre su propio modo de elaborar aquello que la atraviesa. En ese recorrido, el proceso terapéutico puede favorecer una relación más consciente con lo que se siente, ampliar la capacidad de reflexión y habilitar nuevas formas de estar en el mundo.
                </p>
              </div>
            </div>

            {/* Title overlapping — positioned absolutely over image */}
            <h2 className="pointer-events-none absolute left-[30%] top-4 z-10 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:left-[28%] lg:top-8 lg:text-8xl">
              EL PROCESO
              <br />
               TERAPÉUTICO
            </h2>
          </div>
        </div>

        {/* ──── Bottom: Session Options ──── */}
        <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-20 lg:pb-32">
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-0">
            {/* White card */}
            <div className="relative z-10 bg-white px-10 py-14 lg:w-[55%] lg:px-16 lg:py-20">
              <h2 className="font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-6xl">
                OPCIONES
                <br />
                DE SESIÓN
              </h2>

              {/* 2×2 Grid */}
              <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2">
                {/* Item 1 */}
                <div className="border-t border-neutral-300 py-6">
                  <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-700">
                    Sesiones Raíz
                  </h4>
                  <p className="mt-3 font-playfair text-base italic font-normal leading-relaxed text-neutral-500">
                    Espacio continuo 1:1 para procesar y ser acompañado
                  </p>
                </div>
                {/* Item 2 */}
                <div className="border-t border-neutral-300 py-6">
                  <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-700">
                    Serie de Recuperación
                  </h4>
                  <p className="mt-3 font-playfair text-base italic font-normal leading-relaxed text-neutral-500">
                    Marco de 8 sesiones para mujeres y madres después del cuidado o la transición
                  </p>
                </div>
                {/* Item 3 */}
                <div className="border-t border-neutral-300 py-6">
                  <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-700">
                    Estaciones de Ti
                  </h4>
                  <p className="mt-3 font-playfair text-base italic font-normal leading-relaxed text-neutral-500">
                    Marco estacional de 4 sesiones para alineación y reflexión
                  </p>
                </div>
                {/* Item 4 */}
                <div className="border-t border-neutral-300 py-6">
                  <h4 className="text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-700">
                    Lado a Lado (Parejas)
                  </h4>
                  <p className="mt-3 font-playfair text-base italic font-normal leading-relaxed text-neutral-500">
                    Apoyo relacional para conexión y claridad
                  </p>
                </div>
              </div>

              {/* Button */}
              <div className="mt-10 flex justify-center">
                <Link
                  href="/terapeutas"
                  className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300"
                >
                  Ver todos los servicios
                </Link>
              </div>
            </div>

            {/* Right image */}
            <div className="relative aspect-[3/4] w-full lg:aspect-auto lg:w-[45%]">
              <Image
                src="/images/seccion3-2.jpg"
                alt="Espacio terapéutico"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* ──── CTA Divider ──── */}
        <div className="relative flex h-[500px] items-center justify-center overflow-hidden lg:h-[573px]">
          <Image
            src="/images/Agenda-tu-primera-sesión.png"
            alt="Centro Márgenes espacio"
            fill
            className="object-cover"
          />
          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-white/80">
                Puedes agendar una primera sesión para conocernos,<br></br> hablar sobre tu situación y ver cómo podemos trabajar juntos.
            </h3>
            <h2 className="mt-4 font-playfair text-4xl font-normal leading-[1.1] text-white lg:text-6xl">
              AGENDA TU PRIMERA SESIÓN
            </h2>
            <div className="mt-10">
              <Link
                href="/reservar"
                className="btn-fill btn-fill-white inline-block border-y border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-white transition-all duration-300"
              >
                AGENDAR
              </Link>
            </div>
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* ──── Navigation Links ──── */}
        <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-16 lg:pb-32">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-0">
            {/* Left: links */}
            <div className="flex-1">
              <h2 className="font-playfair text-3xl font-normal text-brand sm:text-4xl lg:text-5xl">
                  PREGUNTAS
              </h2>
               <h2 className="font-playfair text-3xl font-normal text-brand sm:text-4xl lg:text-5xl">
                 FRECUENTES
              </h2>
              <p className="mt-6 text-sm leading-[1.8] text-brand">
                  Es natural tener preguntas antes de comenzar un proceso terapéutico.<br></br>
                  Aquí respondemos algunas de las dudas más comunes sobre las sesiones,<br></br> el funcionamiento de la terapia y cómo empezar.
              </p>
              <Link href="/terapeutas" className="group block border-b border-neutral-400/50 py-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-[11px] font-light italic text-brand">01/</span>
                  <span className="font-playfair text-base font-normal uppercase tracking-wide text-brand transition-colors group-hover:text-neutral-900 lg:text-lg">
                   ¿Qué es el psicoanálisis y cómo puede ayudarme?
                  </span>
                </div>
              </Link>
              <Link href="/nosotros" className="group block border-b border-neutral-400/50 py-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-[11px] font-light italic text-brand">02/</span>
                  <span className="font-playfair text-base font-normal uppercase tracking-wide text-brand transition-colors group-hover:text-neutral-900 lg:text-lg">
                    ¿Cómo es una sesión de psicoanálisis?
                  </span>
                </div>
              </Link>
                <Link href="/nosotros" className="group block border-b border-neutral-400/50 py-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-[11px] font-light italic text-brand">02/</span>
                  <span className="font-playfair text-base font-normal uppercase tracking-wide text-brand transition-colors group-hover:text-neutral-900 lg:text-lg">
                    ¿Necesito tener un problema grave para empezar un análisis?
                  </span>
                </div>
              </Link>
              <Link href="/reservar" className="group block border-b border-neutral-400/50 py-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-[11px] font-light italic text-brand">03/</span>
                  <span className="font-playfair text-base font-normal uppercase tracking-wide text-brand transition-colors group-hover:text-neutral-900 lg:text-lg">
                    ¿Qué tipo de problemas se pueden trabajar?
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: image */}
            <div className="relative mt-10 aspect-[3/4] w-full max-w-[350px] flex-shrink-0 overflow-hidden lg:ml-16 lg:mt-0">
              <Image
                src="/images/Preguntas-frecuentes-marco.png"
                alt="Centro Márgenes"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
