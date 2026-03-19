"use client";

interface StepConditionsProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function StepConditions({ accepted, onAcceptChange }: StepConditionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          Condiciones de atención
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Antes de seguir, te invitamos a leer con atención este apartado. Es importante que conozcas las condiciones del espacio y resuelvas cualquier duda.
        </p>
      </div>

      <div className="space-y-4 rounded border p-4 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            El valor de la primera sesión es de $35.000 y el arancel para el proceso se acordará con el analista, quien considerará la declaración socioeconómica dentro del formulario de inscripción.
          </li>
          <li>
            El pago de la sesión debe ser realizado anticipadamente hasta las 10:00 PM. del día anterior a la sesión.
          </li>
          <li>
            Se abordará el proceso terapéutico desde el enfoque psicoanalítico.
          </li>
          <li>
            La duración de la terapia puede ser variable, por lo que se sugiere a el/la paciente proyectarse en el mediano a largo plazo. Estas son una vez por semana como mínimo (pueden ser más).
          </li>
          <li>
            Las sesiones tendrán una duración de 45 minutos a 1 hora. Tanto de forma presencial como online es fundamental cumplir con el horario indicado, en caso contrario, el analista podrá esperarlo y la sesión durará el resto del tiempo acordado.
          </li>
          <li>
            Si hay tres inasistencias consecutivas sin previo aviso se liberará su cupo de atención.
          </li>
          <li>
            En caso de no poder asistir a sesión, dicha sesión se cobrará, a menos que se avise con 24 horas de anticipación. Entendiendo que lo que se paga es la reserva de un horario y su analista lo estará esperando.
          </li>
          <li>
            La sesión se puede cancelar exclusivamente por motivos de urgencia. Los motivos deben ser conversados con el analista. Se podrá reagendar si este tiene otros horarios disponibles durante la misma semana o se podrá recuperar dicha sesión la semana siguiente.
          </li>
        </ul>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-400"
        />
        <span className="text-sm">
          He leído el consentimiento informado y estoy de acuerdo con las condiciones de atención descritas.
        </span>
      </label>
    </div>
  );
}
