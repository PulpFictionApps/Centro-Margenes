import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Therapist } from "@/lib/types";

async function getTherapist(id: string): Promise<Therapist | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const therapist = await getTherapist(params.id);
  if (!therapist) return { title: "Terapeuta no encontrado" };
  return {
    title: therapist.name,
    description:
      therapist.bio?.slice(0, 160) ||
      `Perfil profesional de ${therapist.name}, terapeuta en Centro Márgenes. Atención psicoanalítica online y presencial.`,
    alternates: {
      canonical: `https://centromargenes.cl/terapeutas/${params.id}`,
    },
    openGraph: therapist.photo_url
      ? {
          images: [
            {
              url: therapist.photo_url,
              alt: therapist.name,
            },
          ],
        }
      : undefined,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TherapistProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const therapist = await getTherapist(params.id);
  if (!therapist) notFound();

  return (
    <>
      {/* Hero */}
      <section className="bg-transparent px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
            {/* Photo */}
            {therapist.photo_url ? (
              <div className="relative h-[350px] w-[280px] flex-shrink-0 overflow-hidden">
                <Image
                  src={therapist.photo_url}
                  alt={therapist.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[350px] w-[280px] flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-5xl text-neutral-500">
                {getInitials(therapist.name)}
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col justify-center text-center lg:text-left">
              <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
                Terapeuta
              </h3>
              <h1 className="mt-4 font-playfair text-4xl font-normal leading-[1.1] text-brand lg:text-6xl">
                {therapist.name}
              </h1>

              {/* Specialties */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                {therapist.specialties.map((s) => (
                  <span
                    key={s}
                    className="border border-neutral-400/50 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-500"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/reservar"
                  className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300"
                >
                  Reservar cita
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[800px]">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Sobre mí
          </h3>
          <div className="mt-8 border-t border-neutral-200 pt-8">
            <p className="text-sm leading-[1.9] text-neutral-900">
              {therapist.bio}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#5b2525] px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-[600px] text-center">
          <h2 className="font-playfair text-3xl font-normal text-white lg:text-4xl">
            ¿Te gustaría agendar una sesión?
          </h2>
          <p className="mt-6 text-sm leading-[1.8] text-white/70">
            Da el primer paso hacia tu bienestar. Reserva una sesión y comienza tu proceso.
          </p>
          <div className="mt-10">
            <Link
              href="/reservar"
              className="btn-fill btn-fill-white inline-block border-y border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-white transition-all duration-300"
            >
              Agendar ahora
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
