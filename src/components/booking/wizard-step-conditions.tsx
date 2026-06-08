"use client";

interface WizardStepConditionsProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function WizardStepConditions({ accepted, onAcceptChange }: WizardStepConditionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-playfair text-lg text-brand">
          Condiciones de atención
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Antes de seguir, te invitamos a leer con atención este apartado. Es importante que conozcas las condiciones del espacio y resuelvas cualquier duda.
        </p>
      </div>

      <div className="space-y-4 rounded border border-neutral-300/60 bg-white/40 p-4 text-sm leading-relaxed text-neutral-700">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            El valor de la primera sesión presencial es de $30.000 y online $25.000. El arancel para el proceso se acordará con el analista, contamos con aranceles diferenciados en función de la situación económica del paciente.
          </li>
          <li>
            El pago de la sesión debe ser realizado anticipadamente hasta las 10:00 PM. del día anterior a la sesión.
          </li>
          <li>
            Se abordará el proceso terapéutico desde el enfoque psicoanalítico.
          </li>
          <li>
            Las sesiones son una vez por semana como mínimo.
          </li>
          <li>
            Las sesiones tendrán una duración de 45 minutos a 1 hora.
          </li>
          <li>
            Si hay tres inasistencias consecutivas sin previo aviso se liberará su cupo de atención.
          </li>
          <li>
            En caso de no poder asistir a sesión, dicha sesión se cobrará, a menos que se avise con 24 horas de anticipación.
          </li>
          <li>
            La sesión se puede cancelar exclusivamente por motivos de urgencia.
          </li>
        </ul>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-400 accent-[#5b2525]"
        />
        <span className="text-sm text-neutral-700">
          He leído el consentimiento informado y estoy de acuerdo con las condiciones de atención descritas.
        </span>
      </label>
    </div>
  );
}
