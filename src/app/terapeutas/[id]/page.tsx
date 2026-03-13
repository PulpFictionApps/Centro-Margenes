import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Therapist } from "@/lib/types";

const demoTherapists: Record<string, Therapist> = {
  "1": {
    id: "1",
    user_id: "",
    name: "Dra. María González",
    email: "maria@centromargenes.cl",
    bio: "Especialista en terapia cognitivo-conductual con más de 10 años de experiencia en el tratamiento de ansiedad, depresión y trastornos del estado de ánimo. Mi enfoque se centra en proporcionar herramientas prácticas para mejorar la calidad de vida de mis pacientes, trabajando desde la comprensión profunda de cada persona.",
    photo_url: null,
    specialties: ["Ansiedad", "Depresión", "Estrés", "Duelo", "Autoestima"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
  "2": {
    id: "2",
    user_id: "",
    name: "Dr. Carlos Mendoza",
    email: "carlos@centromargenes.cl",
    bio: "Enfocado en el trabajo con niños y adolescentes, utilizando técnicas de juego terapéutico y terapia familiar sistémica. Creo en la importancia de involucrar a toda la familia en el proceso terapéutico para lograr cambios significativos y duraderos.",
    photo_url: null,
    specialties: ["Infanto-juvenil", "Familia", "TDAH", "Conducta", "Bullying"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
  "3": {
    id: "3",
    user_id: "",
    name: "Dra. Ana Beltrán",
    email: "ana@centromargenes.cl",
    bio: "Experta en terapia de parejas y relaciones interpersonales con enfoque sistémico e integrativo. Mi trabajo se centra en ayudar a las parejas a construir relaciones más saludables y satisfactorias, desarrollando habilidades de comunicación y resolución de conflictos.",
    photo_url: null,
    specialties: ["Parejas", "Relaciones", "Autoestima", "Sexualidad", "Crisis"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
};

async function getTherapist(id: string): Promise<Therapist | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return demoTherapists[id] ?? null;
    return data;
  } catch {
    return demoTherapists[id] ?? null;
  }
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
      <section className="bg-[#EDE6CA] px-6 py-24 lg:py-32">
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
            <p className="text-sm leading-[1.9] text-neutral-600">
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
