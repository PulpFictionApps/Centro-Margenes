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

        {/* ──── Bottom: Session Options ──── */}
        <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-20 lg:pb-32">
          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* Left: stacked list */}
            <div className="flex-1">
              {/* Item 1 */}
              <div className="border-b border-neutral-400/50 pb-10 pt-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                  Sesiones Raíz
                </h4>
                <p className="mt-1 font-playfair text-sm italic text-brand/70">
                  Terapia individual
                </p>
                <p className="mt-4 max-w-[700px] text-sm leading-[1.8] text-neutral-600">
                  Espacio continuo y semanal de escucha psicoanalítica, donde cada persona puede hablar libremente sobre aquello que le genera malestar. Un proceso singular que se construye respetando el ritmo y la historia de cada sujeto.
                </p>
                <Link href="/reservar" className="mt-4 inline-block font-playfair text-sm italic text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-neutral-900">
                  Agendar sesión ➝
                </Link>
              </div>

              {/* Item 2 */}
              <div className="border-b border-neutral-400/50 pb-10 pt-10">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                  Serie de Recuperación
                </h4>
                <p className="mt-1 font-playfair text-sm italic text-brand/70">
                  Programa de 8 sesiones
                </p>
                <p className="mt-4 max-w-[700px] text-sm leading-[1.8] text-neutral-600">
                  Marco de 8 sesiones pensado para mujeres y madres en procesos de transición o después del cuidado. Un espacio para elaborar las experiencias que atraviesan la maternidad, el duelo y los cambios vitales.
                </p>
                <p className="mt-4 font-playfair text-sm italic text-brand/70">
                  Próximamente
                </p>
              </div>

              {/* Item 3 */}
              <div className="border-b border-neutral-400/50 pb-10 pt-10">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                  Estaciones de Ti
                </h4>
                <p className="mt-1 font-playfair text-sm italic text-brand/70">
                  Ciclo de 4 sesiones
                </p>
                <p className="mt-4 max-w-[700px] text-sm leading-[1.8] text-neutral-600">
                  Marco estacional de 4 sesiones para alineación y reflexión. Un espacio breve e intensivo para hacer una pausa, revisarse y reconectar con lo que importa en cada etapa.
                </p>
                <p className="mt-4 font-playfair text-sm italic text-brand/70">
                  Próximamente
                </p>
              </div>

              {/* Item 4 */}
              <div className="border-b border-neutral-400/50 pb-10 pt-10">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                  Lado a Lado (Parejas)
                </h4>
                <p className="mt-1 font-playfair text-sm italic text-brand/70">
                  Terapia de pareja
                </p>
                <p className="mt-4 max-w-[700px] text-sm leading-[1.8] text-neutral-600">
                  Apoyo relacional para parejas que buscan conexión y claridad. Un proceso donde ambos pueden ser escuchados y trabajar juntos las dinámicas que generan malestar en el vínculo.
                </p>
                <p className="mt-4 font-playfair text-sm italic text-brand/70">
                  Próximamente
                </p>
              </div>
            </div>

            {/* Right: tall image */}
            <div className="relative mt-10 aspect-[3/4] w-full max-w-[400px] flex-shrink-0 lg:mt-0">
              <Image
                src="/images/Preguntas-frecuentes-marco.png"
                alt="Centro Márgenes"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
