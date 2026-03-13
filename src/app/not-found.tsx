import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-[#EDE6CA] px-6">
      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
        Error 404
      </p>
      <h1 className="mt-4 font-playfair text-5xl font-normal text-brand lg:text-7xl">
        Página no encontrada
      </h1>
      <p className="mt-6 max-w-md text-center text-sm leading-relaxed text-neutral-500">
        Lo sentimos, la página que buscas no existe o fue movida.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="inline-block border-y border-brand px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
