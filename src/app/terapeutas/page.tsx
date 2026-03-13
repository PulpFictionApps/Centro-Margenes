import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Therapist } from "@/lib/types";

// Demo data used when Supabase is not configured
const demoTherapists: Therapist[] = [
  {
    id: "1",
    user_id: "",
    name: "Dra. María González",
    email: "maria@centromargenes.cl",
    bio: "Especialista en terapia cognitivo-conductual con más de 10 años de experiencia en el tratamiento de ansiedad y depresión.",
    photo_url: null,
    specialties: ["Ansiedad", "Depresión", "Estrés"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    user_id: "",
    name: "Dr. Carlos Mendoza",
    email: "carlos@centromargenes.cl",
    bio: "Enfocado en el trabajo con niños y adolescentes, utilizando técnicas de juego terapéutico y terapia familiar.",
    photo_url: null,
    specialties: ["Infanto-juvenil", "Familia", "TDAH"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    user_id: "",
    name: "Dra. Ana Beltrán",
    email: "ana@centromargenes.cl",
    bio: "Experta en terapia de parejas y relaciones interpersonales. Trabaja con un enfoque sistémico e integrativo.",
    photo_url: null,
    specialties: ["Parejas", "Relaciones", "Autoestima"],
    offers_online: true,
    offers_in_person: true,
    active: true,
    role: "therapist",
    created_at: "",
    updated_at: "",
  },
];

async function getTherapists(): Promise<Therapist[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .order("name");

    if (error || !data || data.length === 0) return demoTherapists;
    return data;
  } catch {
    return demoTherapists;
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

export default async function TerapeutasPage() {
  const therapists = await getTherapists();

  return (
    <>
      {/* Hero */}
      <section className="bg-[#EDE6CA] px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-[800px] text-center">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Nuestro equipo
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            Terapeutas
          </h1>
          <p className="mt-8 text-sm leading-[1.9] text-neutral-500">
            Profesionales comprometidos con tu bienestar emocional, cada uno con una mirada
            única y una profunda vocación por el acompañamiento humano.
          </p>
        </div>
      </section>

      {/* Therapists list */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="space-y-0">
            {therapists.map((therapist, i) => (
              <Link
                key={therapist.id}
                href={`/terapeutas/${therapist.id}`}
                className="group block border-b border-neutral-200 py-10 transition-colors first:border-t lg:py-14"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
                  {/* Number + Avatar */}
                  <div className="flex items-center gap-6 lg:w-[300px]">
                    <span className="text-[11px] font-light italic text-neutral-400">
                      0{i + 1}/
                    </span>
                    {therapist.photo_url ? (
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={therapist.photo_url}
                          alt={therapist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[#ddd6b3] font-playfair text-lg text-neutral-600">
                        {getInitials(therapist.name)}
                      </div>
                    )}
                    <h3 className="font-playfair text-2xl font-normal text-brand transition-colors group-hover:text-neutral-600 lg:text-3xl">
                      {therapist.name}
                    </h3>
                  </div>

                  {/* Bio */}
                  <p className="flex-1 text-sm leading-[1.8] text-neutral-500 lg:max-w-[400px]">
                    {therapist.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 lg:w-[250px] lg:justify-end">
                    {therapist.specialties.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="border border-neutral-300 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-neutral-500"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#5b2525] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[600px] text-center">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-white/60">
            Da el primer paso
          </h3>
          <h2 className="mt-6 font-playfair text-3xl font-normal text-white lg:text-5xl">
            Encuentra a tu terapeuta
          </h2>
          <p className="mt-6 text-sm leading-[1.8] text-white/70">
            Cada camino es distinto. Reserva tu primera sesión y comienza a explorar el tuyo.
          </p>
          <div className="mt-10">
            <Link
              href="/reservar"
              className="btn-fill btn-fill-white inline-block border-y border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-white transition-all duration-300"
            >
              Reservar cita
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
