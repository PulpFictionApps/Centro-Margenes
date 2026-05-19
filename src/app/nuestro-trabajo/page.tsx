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
              <div className="pointer-events-none absolute -bottom-24 -left-48 hidden lg:block" style={{ opacity: 0.1, transform: 'translateY(140px)' }}>
                <Image
                  src="/images/Diban2.png"
                  alt=""
                  width={680}
                  height={1000}
                  className="object-contain"
                />
              </div>
              <p className="text-sm leading-[1.9] text-neutral-900">
                Somos un grupo de psicoanalistas que trabajamos y estudiamos el malestar subjetivo producido en nuestros tiempos. Nos posicionamos críticamente frente al psicoanálisis hegemónico y frente a la individualización del malestar. Destacamos la convicción del psicoanálisis de poner el núcleo del malestar en la intersubjetividad, es decir, en los modos en que los sujetos se constituyen en cuanto tales y así mismo su malestar, en una red de relaciones múltiples modeladas social, cultural, económica y discursivamente.
              </p>
              <p className="mt-6 text-sm leading-[1.9] text-neutral-900">
              Nos proponemos no solo acompañar a quienes consultan en esta exploración de aquello que los aqueja y el sentido de lo que viven, sino también en poder ir estableciendo espacios de diálogo con otros profesionales, tanto del terreno de lo “psi” como en otras áreas, con el fin de enriquecer el trabajo en comunidad, entendiendo que el malestar no se vive solo, sino que emerge desde aquello cotidiano y vincular, enmarcado en las estructuras sociales y de poder que rigen nuestra sociedad.              </p>
              <p className="mt-6 text-sm leading-[1.9] text-neutral-900">
              Te invitamos a conocer nuestro trabajo.              </p>
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