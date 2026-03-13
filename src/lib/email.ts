import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Centro Márgenes <no-reply@centromargenes.com>";

// ─── Types ─────────────────────────────────────────────────────────
export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  therapistName: string;
  serviceName: string;
  date: string;        // "2026-03-15"
  time: string;        // "10:00"
  modality: string;    // "Online" | "Presencial"
  branchName: string;
  meetingLink?: string | null;
  cancellationToken?: string;
}

// ─── Date formatting helper ────────────────────────────────────────
function formatDateES(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Shared HTML layout ────────────────────────────────────────────
function emailLayout(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE6CA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE6CA;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#5b2525;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#EDE6CA;font-size:24px;font-weight:400;letter-spacing:0.05em;">
                Centro Márgenes
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f6ee;padding:24px 40px;text-align:center;border-top:1px solid #e8e2d0;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                Centro Márgenes &mdash; Psicología y Bienestar<br/>
                Este correo fue enviado automáticamente. Por favor, no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Detail row helper ─────────────────────────────────────────────
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;width:140px;">
        ${label}
      </td>
      <td style="padding:8px 0;font-size:15px;color:#333;vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

// ─── Confirmation email ────────────────────────────────────────────
function confirmationHtml(data: AppointmentEmailData): string {
  const dateFormatted = formatDateES(data.date);

  let details = "";
  details += detailRow("Terapeuta", data.therapistName);
  details += detailRow("Servicio", data.serviceName);
  details += detailRow("Fecha", dateFormatted);
  details += detailRow("Hora", data.time + " hrs");
  details += detailRow("Modalidad", data.modality);

  if (data.modality === "Online" && data.meetingLink) {
    details += detailRow(
      "Enlace",
      `<a href="${data.meetingLink}" style="color:#5b2525;text-decoration:underline;">${data.meetingLink}</a>`
    );
  } else if (data.modality === "Presencial") {
    details += detailRow("Lugar", data.branchName);
  }

  let body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#5b2525;font-weight:400;">
      ¡Cita confirmada!
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Hola <strong>${data.patientName}</strong>, tu cita ha sido registrada exitosamente.
      A continuación los detalles:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;padding:16px;">
      ${details}
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#777;line-height:1.6;">
      Si necesitas cancelar o reprogramar tu cita, contáctanos con al menos 24 horas de anticipación.
    </p>`;

  if (data.cancellationToken) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://centromargenes.com";
    const cancelUrl = `${baseUrl}/cancelar/${data.cancellationToken}`;
    body += `
    <div style="margin:24px 0 0;text-align:center;">
      <a href="${cancelUrl}" style="display:inline-block;padding:12px 28px;background-color:#5b2525;color:#EDE6CA;text-decoration:none;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">
        Cancelar mi cita
      </a>
      <p style="margin:8px 0 0;font-size:12px;color:#999;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="${cancelUrl}" style="color:#5b2525;">${cancelUrl}</a>
      </p>
    </div>`;
  }

  return emailLayout("Confirmación de Cita - Centro Márgenes", body);
}

// ─── Reminder email ────────────────────────────────────────────────
function reminderHtml(data: AppointmentEmailData, hoursBeforeLabel: string): string {
  const dateFormatted = formatDateES(data.date);

  let details = "";
  details += detailRow("Terapeuta", data.therapistName);
  details += detailRow("Servicio", data.serviceName);
  details += detailRow("Fecha", dateFormatted);
  details += detailRow("Hora", data.time + " hrs");
  details += detailRow("Modalidad", data.modality);

  if (data.modality === "Online" && data.meetingLink) {
    details += detailRow(
      "Enlace",
      `<a href="${data.meetingLink}" style="color:#5b2525;text-decoration:underline;">${data.meetingLink}</a>`
    );
  } else if (data.modality === "Presencial") {
    details += detailRow("Lugar", data.branchName);
  }

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#5b2525;font-weight:400;">
      Recordatorio de cita
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Hola <strong>${data.patientName}</strong>, te recordamos que tu cita es en <strong>${hoursBeforeLabel}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;padding:16px;">
      ${details}
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#777;line-height:1.6;">
      Si no puedes asistir, por favor contáctanos lo antes posible.
    </p>`;

  return emailLayout("Recordatorio de Cita - Centro Márgenes", body);
}

// ─── Public send functions ─────────────────────────────────────────

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const html = confirmationHtml(data);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.patientEmail,
    subject: `Confirmación de cita — ${formatDateES(data.date)}, ${data.time} hrs`,
    html,
  });

  if (error) {
    console.error("[Email] Confirmation send failed:", error);
  }

  return { error };
}

export async function sendAppointmentReminder(
  data: AppointmentEmailData,
  hoursBeforeLabel: string
) {
  const html = reminderHtml(data, hoursBeforeLabel);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.patientEmail,
    subject: `Recordatorio: cita ${hoursBeforeLabel} — ${data.time} hrs`,
    html,
  });

  if (error) {
    console.error("[Email] Reminder send failed:", error);
  }

  return { error };
}
