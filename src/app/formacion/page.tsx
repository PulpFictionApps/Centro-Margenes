import Image from "next/image";

export default function FormacionPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-transparent">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <h1 className="mb-12 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            FORMACIÓN
          </h1>
          <div className="relative flex flex-col items-center gap-12 lg:flex-row lg:items-start">
            {/* Ilustración decorativa libros — anclada al pie del row */}
            <div className="pointer-events-none absolute -bottom-[35px] -left-48 hidden lg:block" style={{ opacity: 0.1 }}>
              <Image
                src="/images/Libros2.png"
                alt=""
                width={680}
                height={1000}
                className="object-contain"
              />
            </div>
            {/* Texto */}
            <div className="relative flex-1">
              <p className="text-sm leading-[1.9] text-neutral-900">
                Centro Márgenes realiza talleres, cursos y grupos de estudio sobre psicoanálisis, abiertos a todo público. Estos espacios buscan acercar la teoría psicoanalítica a un público más amplio, abordando conceptos, lecturas y preguntas fundamentales del campo, y promoviendo el diálogo, la reflexión y el intercambio entre quienes deseen iniciar o profundizar su recorrido en esta área.
              </p>
            </div>
            {/* Imagen */}
            <div className="relative w-full shrink-0 lg:w-[420px]" style={{ height: "587px" }}>
              <Image
                src="/images/imagenformacion.png"
                alt="Formación"
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
