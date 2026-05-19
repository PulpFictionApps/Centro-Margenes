import Image from "next/image";

export default function ConveniosPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-transparent">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <h1 className="mb-12 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            CONVENIOS
          </h1>
          <div className="relative flex flex-col items-center gap-12 lg:flex-row lg:items-start">
            {/* Ilustración decorativa sitial — anclada al pie del row */}
            <div className="pointer-events-none absolute -bottom-[35px] -left-48 hidden lg:block" style={{ opacity: 0.1 }}>
              <Image
                src="/images/Sitial2.png"
                alt=""
                width={680}
                height={1000}
                className="object-contain"
              />
            </div>
            {/* Texto */}
            <div className="relative flex-1">
              <p className="text-sm leading-[1.9] text-neutral-900">
                Centro Márgenes cuenta con convenio con isapres. Tras la atención, se entrega la documentación necesaria para gestionar el reembolso de manera rápida y sencilla ante la isapre correspondiente. Además, contamos con aranceles diferenciados para pacientes con dificultades económicas. Actualmente disponemos de cupos de convenio para instituciones educativas y organizaciones que deseen vincularse con nuestro centro con el objetivo de favorecer un acceso más inclusivo a la atención psicológica. Para más información ponte en contacto con nosotros{" "}
                <a href="mailto:centropsicoanalitico.margenes@gmail.com" className="text-brand underline decoration-brand/40 underline-offset-4 hover:text-neutral-900">
                  centropsicoanalitico.margenes@gmail.com
                </a>.
              </p>
            </div>
            {/* Imagen */}
            <div className="relative w-full shrink-0 lg:w-[420px]" style={{ height: "587px" }}>
              <Image
                src="/images/imagenconvenios.png"
                alt="Convenios"
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
