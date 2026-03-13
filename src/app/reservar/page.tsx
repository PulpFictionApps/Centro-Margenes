"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BookingWizardModal } from "@/components/booking/booking-wizard-modal";
import type { Therapist, Service, Branch, TherapistService } from "@/lib/types";

const demoServices: Service[] = [
  {
    id: "1",
    name: "Psicoterapia adultos",
    description: "Sesión individual de psicoterapia para adultos.",
    duration_minutes: 50,
    created_at: "",
  },
  {
    id: "2",
    name: "Terapia de pareja",
    description: "Sesión orientada a mejorar la relación de pareja.",
    duration_minutes: 50,
    created_at: "",
  },
  {
    id: "3",
    name: "Psicoterapia adolescentes",
    description: "Sesión especializada para adolescentes.",
    duration_minutes: 50,
    created_at: "",
  },
  {
    id: "4",
    name: "Terapia familiar",
    description: "Sesión de terapia con enfoque sistémico familiar.",
    duration_minutes: 50,
    created_at: "",
  },
];

const demoTherapists: Therapist[] = [
  {
    id: "1",
    user_id: "",
    name: "Dra. María González",
    email: "maria@centromargenes.cl",
    bio: "Especialista en terapia cognitivo-conductual con más de 10 años de experiencia.",
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
    bio: "Enfocado en el trabajo con niños y adolescentes.",
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
    bio: "Experta en terapia de parejas y relaciones interpersonales.",
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

const demoBranches: Branch[] = [
  {
    id: "1",
    name: "Online",
    type: "online",
    address: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    name: "Sede Santiago Centro",
    type: "in_person",
    address: "Av. Providencia 1234, Santiago",
    created_at: "",
    updated_at: "",
  },
];

export default function ReservarPage() {
  const [services, setServices] = useState<Service[]>(demoServices);
  const [therapists, setTherapists] = useState<Therapist[]>(demoTherapists);
  const [branches, setBranches] = useState<Branch[]>(demoBranches);
  const [therapistServices, setTherapistServices] = useState<TherapistService[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [servicesRes, therapistsRes, branchesRes, tsRes] = await Promise.all([
          supabase.from("services").select("*").order("name"),
          supabase.from("therapists").select("*").order("name"),
          supabase.from("branches").select("*").order("name"),
          supabase.from("therapist_services").select("*"),
        ]);

        if (servicesRes.data && servicesRes.data.length > 0) {
          setServices(servicesRes.data);
        }
        if (therapistsRes.data && therapistsRes.data.length > 0) {
          setTherapists(therapistsRes.data);
        }
        if (branchesRes.data && branchesRes.data.length > 0) {
          setBranches(branchesRes.data);
        }
        if (tsRes.data) {
          setTherapistServices(tsRes.data);
        }
      } catch {
        // Use demo data on error
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        {/* Left content */}
        <div className="relative z-10 flex w-full flex-col items-center bg-[#EDE6CA] px-6 py-24 text-center lg:w-1/2 lg:items-start lg:py-32 lg:pl-[8%] lg:pr-16 lg:text-left">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Tu bienestar comienza aquí
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            Reservar
            <br />
            una cita
          </h1>
          <p className="mt-8 max-w-[420px] text-sm leading-[1.9] text-neutral-500">
            Agenda tu sesión de terapia en solo unos minutos. Elige al terapeuta,
            la modalidad y el horario que mejor se adapten a ti.
          </p>
          <div className="mt-10">
            <button
              onClick={() => setOpen(true)}
              className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300"
            >
              Comenzar reserva
            </button>
          </div>
        </div>

        {/* Right image */}
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src="/images/seccion3-2.jpg"
            alt="Centro Márgenes espacio"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
              Proceso simple
            </h3>
            <h2 className="mt-6 font-playfair text-3xl font-normal text-brand lg:text-5xl">
              ¿Cómo funciona?
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { step: "01", title: "Modalidad", desc: "Elige entre sesión online o presencial" },
              { step: "02", title: "Tratamiento", desc: "Selecciona el tipo de terapia" },
              { step: "03", title: "Terapeuta", desc: "Escoge al profesional ideal" },
              { step: "04", title: "Fecha y hora", desc: "Encuentra el horario perfecto" },
              { step: "05", title: "Tus datos", desc: "Confirma tu información" },
            ].map((item) => (
              <div
                key={item.step}
                className="border-t border-neutral-200 px-4 py-8 text-center lg:border-l lg:border-t-0 lg:first:border-l-0 lg:px-6"
              >
                <span className="text-[11px] font-light italic text-neutral-400">
                  {item.step}/
                </span>
                <h4 className="mt-4 font-playfair text-lg font-normal text-brand">
                  {item.title}
                </h4>
                <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              onClick={() => setOpen(true)}
              className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300"
            >
              Iniciar agendamiento
            </button>
          </div>
        </div>
      </section>

      <BookingWizardModal
        open={open}
        onOpenChange={setOpen}
        services={services}
        therapists={therapists}
        branches={branches}
        therapistServices={therapistServices}
      />
    </>
  );
}
