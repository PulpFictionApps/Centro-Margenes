import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar Cita",
  description:
    "Agenda tu consulta psicológica en Centro Márgenes. Atención psicoanalítica online y presencial en Providencia, Santiago. Elige terapeuta, modalidad y horario disponible.",
  alternates: {
    canonical: "https://centromargenes.cl/reservar",
  },
};

export default function ReservarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
