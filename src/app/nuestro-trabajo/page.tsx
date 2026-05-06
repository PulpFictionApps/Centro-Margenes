import Image from "next/image";

export default function NuestroTrabajoPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-transparent">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <h1 className="mb-12 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            NUESTRO TRABAJO
          </h1>
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start">
            {/* Texto */}
            <div className="relative flex-1">
              {/* Ilustración decorativa diván */}
              <div className="pointer-events-none absolute -bottom-24 -left-48 hidden lg:block" style={{ opacity: 0.2, transform: 'translateY(140px)' }}>
                <Image
                  src="/images/Diban2.png"
                  alt=""
                  width={680}
                  height={1000}
                  className="object-contain"
                />
              </div>
              <p className="text-sm leading-[1.9] text-neutral-500">
                Somos un grupo de 4 psicoanalistas que trabajamos y estudiamos el malestar subjetivo
                producido en nuestros tiempos. Nos posicionamos cr&#237;ticamente frente al psiconan&#225;lisis
                hegem&#243;nico y frente a la individualizaci&#243;n del malestar. Destacamos la convicci&#243;n del
                psicoan&#225;lisis de poner el n&#250;cleo del malestar en la intersubjetividad, es decir, en los modos
                en que los sujetos se constituyen en cuanto tales y as&#237; mismo su malestar, en una red de
                relaciones m&#250;ltiples modeladas social, cultural, econ&#243;mica y discursivamente.
              </p>
              <p className="mt-6 text-sm leading-[1.9] text-neutral-500">
                El prop&#243;sito de Centro M&#225;rgenes es sostener un espacio donde el psicoan&#225;lisis se practique como una experiencia en los bordes: no orientada a normalizar ni a corregir, sino a leer aquello que irrumpe como diferencia, desajuste o no-coincidencia del sujeto consigo mismo, haciendo de ese &ldquo;margen&rdquo; un lugar productivo desde el cual se pueda escribir, interrogar y transformar.
              </p>
              <p className="mt-6 text-sm leading-[1.9] text-neutral-500">
                El Centro ofrece atenci&#243;n cl&#237;nica y adem&#225;s se presenta como un dispositivo donde el error, la duda y el desv&#237;o no son obst&#225;culos, sino condiciones para el trabajo.
              </p>
            </div>
            {/* Imagen */}
            <div className="relative w-full shrink-0 lg:w-[420px]" style={{ height: '587px' }}>
              <Image
                src="/images/NuestroTrabajo.jpeg"
                alt="Nuestro trabajo"
                fill
                className="rounded-sm object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}