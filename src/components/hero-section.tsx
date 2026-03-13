import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative -mt-[5.9rem] w-full overflow-hidden" style={{ height: "87vh" }}>
      <Image
        src="/images/header.png"
        alt="Centro Márgenes"
        fill
        className="object-cover object-top"
        priority
      />

      {/* Overlay content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <h1 className="font-playfair text-[clamp(3rem,7vw,6.5rem)] font-normal leading-[0.93] text-white">
          TU HISTORIA
          <br />
          SE REESCRIBE
          <br />
          EN LOS MARGENES
        </h1>
        <p className="mt-8 text-[15px] font-light uppercase tracking-[4px] text-white/80">
          Bienvenido a nuestro centro
        </p>
      </div>
    </section>
  );
}
