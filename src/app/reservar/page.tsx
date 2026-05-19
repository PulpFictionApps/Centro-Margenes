"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BookingWizardModal } from "@/components/booking/booking-wizard-modal";
import type { Therapist, Service, Branch, TherapistService } from "@/lib/types";

export default function ReservarPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [therapistServices, setTherapistServices] = useState<TherapistService[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [servicesRes, therapistsRes, branchesRes, tsRes] = await Promise.all([
          supabase.from("services").select("*").order("name"),
          supabase.from("therapists").select("*").eq("active", true).order("name"),
          supabase.from("branches").select("*").order("name"),
          supabase.from("therapist_services").select("*"),
        ]);

        if (servicesRes.data) setServices(servicesRes.data);
        if (therapistsRes.data) setTherapists(therapistsRes.data);
        if (branchesRes.data) setBranches(branchesRes.data);
        if (tsRes.data) setTherapistServices(tsRes.data);
      } catch {
        // intentionally left empty — page stays in empty state if DB is unreachable
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100dvh-5.9rem)] items-center overflow-hidden">
        {/* Left content */}
        <div className="relative z-10 flex w-full flex-col items-center bg-[#EDE6CA] px-6 py-24 text-center lg:w-1/2 lg:items-start lg:py-32 lg:pl-[8%] lg:pr-16 lg:text-left">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.25em] text-neutral-500">
            Agenda tu primera consulta
          </h3>
          <h1 className="mt-6 font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
            RESERVAR
            <br />
            UNA CITA
          </h1>
          <p className="mt-8 max-w-[420px] text-sm leading-[1.9] text-neutral-900">
            Agenda tu sesión de terapia en pocos minutos. Elige al formato y el horario que mejor se adapten a ti. Nos pondremos en contacto contigo a la brevedad.
          </p>
          <div className="mt-10">
            <button
              onClick={() => setOpen(true)}
              disabled={loading}
              className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Comenzar reserva"}
            </button>
          </div>
        </div>

        {/* Right image */}
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src="/images/ImagenReserva.jpg"
            alt="Centro Márgenes espacio"
            fill
            className="object-cover object-left"
            sizes="50vw"
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

          <div className="mt-16 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { step: "01", title: "Modalidad", desc: "Elige entre sesión online o presencial" },
              { step: "02", title: "Tratamiento", desc: "Selecciona el tipo de consulta" },
              { step: "03", title: "Terapeuta", desc: "Escoge al profesional" },
              { step: "04", title: "Fecha y hora", desc: "Escoge tu horario" },
              { step: "05", title: "Condiciones", desc: "Lee y confirma las condiciones de atencion" },
              { step: "06", title: "Tus datos", desc: "Confirma tu información" },
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
                <p className="mt-3 text-xs leading-relaxed text-neutral-900">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              onClick={() => setOpen(true)}
              disabled={loading}
              className="btn-fill btn-fill-tan inline-block border-y border-[#5b2525] px-10 py-4 text-xs font-normal uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Iniciar agendamiento"}
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
