import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Resuelve tus dudas sobre el psicoanálisis, el proceso terapéutico, la modalidad online y presencial, los convenios y cómo funciona Centro Márgenes.",
  alternates: {
    canonical: "https://centromargenes.cl/preguntas-frecuentes",
  },
};

const faqs = [
  {
    id: "01",
    image: "/images/pregunta1.jpg",
    question: "¿Qué es el Psicoanálisis y cómo puede ayudarme?",
    answer: [
      "El psicoanálisis es un método de tratamiento de síntomas y diversos modos de malestar de la subjetividad humana a partir de la palabra. Desde su invención con Freud, la investigación del malestar mediante el método analítico evidenció que los síntomas neuróticos no se relacionaban a causas orgánicas (haciendo de límite a la comprensión de la medicina), sino a recuerdos, escenas, fantasías, temores y deseos de los sujetos en relación a su historia y sus otros significativos. Lacan retoma y reformula alguna de estas ideas y resalta la lógica de lenguaje que subyace y articula los diversos elementos de las tramas alrededor del síntoma.",
      "En base a lo anterior, el trabajo terapéutico analítico permite ir desde la evidencia y el sufrimiento que el síntoma conlleva, a los diversos aspectos que se encuentran en su raíz: la historia, las ideas y pensamientos, los ideales, fantasías y temores, la imagen de sí mismo y los demás, entre otros. La reelaboración o resignificación de las diversas tramas en participación en el síntoma es la que permite acceder a una mejor posición en la historia personal y un alivio del exceso de malestar.",
    ],
  },
  {
    id: "02",
    image: "/images/pregunta2.jpg",
    question: "¿Cómo es una sesión de Psicoanálisis?",
    answer: [
      "Una sesión de psicoanálisis tiene como hilo conductor la palabra del consultante/analizante. La consigna que comanda el modo de hablar en una sesión analítica propone que se hable de la manera más libre posible, sin desestimar ideas por ser en apariencia irrelevantes o absurdas. En un principio es el malestar el que funciona como guía de los temas a tratar. El analista propondrá preguntas que permitan un mayor y más rico desarrollo de los asuntos implicados en cada caso.",
      "El analista, la mayor parte de las veces, no fuerza los temas a tratar en una sesión. Se entiende que el abordaje de cada asunto o problemática se genera gradualmente, a los tiempos que el mismo diálogo y cada persona puede producir, y que la construcción eslabón por eslabón de cada tema e historia, son factores importantísimos de tacto clínico y que siempre hay que respetar.",
    ],
  },
  {
    id: "03",
    image: "/images/pregunta3.jpg",
    question: "¿Necesito tener un problema grave para empezar un análisis?",
    answer: [
      "La gravedad en psicoanálisis es absolutamente subjetiva: cada quien puede sentir y experimentar que algo es grave según sus propios parámetros. Por otra parte, la gravedad, si bien puede ser un indicador de cierto punto límite para alguien, no constituye la exclusiva ocasión para consultar. Puede ser algo mucho más sutil: una molestia que se tiene desde hace tiempo, una pregunta, un tema pasado por alto frecuentemente, pero que insiste, y que haya irrumpido en una coyuntura específica.",
      "Es común que, una vez se haya consultado por algún tema, sea el proceso del análisis mismo el que permita sacar a la luz o poner de manifiesto problemática de base, como por ejemplo patrones o modos estereotipados de relacionarse que dificultan lazos y distintos ámbitos de la vida (familiar, amorosa, laboral, social).",
    ],
  },
  {
    id: "04",
    image: "/images/pregunta4.jpg",
    question: "¿Qué tipo de problemas se pueden trabajar?",
    answer: [
      "La búsqueda de tratamiento puede ser motivada desde diversas necesidades, siendo las más comunes procesos que involucren la angustia como un duelo o pérdida, tristeza recurrente, situaciones vitales que puedan ser impactantes para la persona o que produzcan un cambio en la cotidianeidad, así como también por la aparición de ansiedad ante nuevos desafíos o decisiones.",
      "Pero no sólo se puede consultar desde la idea de malestar, sino también desde la intención de conocer mejor la propia forma de abordar la vida, de situarse ante lo que ocurre en la actualidad, orientarse en un mundo cambiante, o acompañarse en el proceso de pensarse más allá de lo que parece establecido. El psicoanálisis invita a pensar fuera de lo convencional, otorgando un acompañamiento que no dirige ni norma, sino más bien, que posibilita la aparición de otras formas de vivir.",
    ],
  },
  {
    id: "05",
    image: "/images/pregunta5.jpg",
    question: "¿Cuánto dura un proceso de terapia psicoanalítica?",
    answer: [
      "La duración de un proceso psicoanalítico nunca se puede establecerse de antemano. Esto se relaciona con el carácter absolutamente singular de cada proceso: depende de los tiempos subjetivos de cada persona, y los ritmos que la transferencia, el tipo de vínculo, posibilite. A modo de estimado, se sugiere que la duración no sea inferior a un año, manteniendo siempre frecuencia semanal.",
      "Cabe aclarar que un psicoanálisis no debe ser eterno, sin fin. La transformación subjetiva es el horizonte del tratamiento, y una vez llevada a cabo el sostenimiento del análisis no sería necesario. Esto no excluye que pueda retomarse en otros momentos de la vida.",
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-transparent">
        <div className="relative z-10 mx-auto max-w-[800px] px-6 py-24 text-center lg:py-32">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Todo lo que necesitas saber
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            PREGUNTAS
            <br />
            FRECUENTES
          </h1>
          <p className="mt-8 text-sm leading-[1.9] text-neutral-900">
            Es natural tener dudas antes de comenzar un proceso terapéutico. Aquí respondemos
            las preguntas más comunes sobre el psicoanálisis, las sesiones y cómo empezar.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="mx-auto max-w-[1100px] px-6 pb-32 pt-4">
        <div className="divide-y divide-neutral-400/50">
          {faqs.map((faq, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={faq.id} id={`pregunta-${faq.id}`} className="scroll-mt-24 py-12">
                <div
                  className={`flex flex-col gap-10 lg:flex-row lg:items-center ${
                    isEven ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden lg:w-[42%]">
                    <Image
                      src={faq.image}
                      alt={faq.question}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 460px"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4">
                      <span className="text-[11px] font-light italic text-brand">{faq.id}/</span>
                      <h2 className="font-playfair text-xl font-normal text-brand lg:text-2xl">
                        {faq.question}
                      </h2>
                    </div>
                    <div className="mt-5 space-y-4">
                      {faq.answer.map((paragraph, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-neutral-900">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 border-t border-neutral-400/50 pt-16 text-center">
          <p className="text-sm leading-[1.8] text-neutral-900">
            ¿Tienes más preguntas? Estamos disponibles para orientarte.
          </p>
          <div className="mt-8">
            <Link
              href="/reservar"
              className="btn-fill btn-fill-brand inline-block border-y border-brand px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-brand transition-all duration-300"
            >
              Agendar una sesión
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
