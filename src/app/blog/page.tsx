export default function BlogPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#EDE6CA]">
        <div className="relative z-10 mx-auto max-w-[800px] px-6 py-24 text-center lg:py-32">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Artículos y reflexiones
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            Blog
          </h1>
          <p className="mt-8 text-sm leading-[1.9] text-neutral-500">
            Próximamente encontrarás artículos, reflexiones y recursos escritos por
            nuestro equipo terapéutico.
          </p>
        </div>
      </section>
    </>
  );
}
