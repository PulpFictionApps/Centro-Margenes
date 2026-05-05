"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, isSupported } =
    usePushNotifications();

  // Hide silently on unsupported browsers (old Safari, etc.)
  if (!isSupported) return null;

  // iOS: must be installed as PWA. Show a hint if running in browser Safari.
  const isIosInBrowser =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(navigator as unknown as { standalone?: boolean }).standalone;

  if (isIosInBrowser) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-neutral-200 bg-[#EDE6CA]/50 px-4 py-3 text-sm text-neutral-500">
        <Bell className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Para recibir notificaciones en iPhone, primero{" "}
          <strong>agrega esta app a tu pantalla de inicio</strong> desde el menú
          &quot;Compartir&quot; de Safari, luego actívalas desde aquí.
        </p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-neutral-200 bg-[#EDE6CA]/50 px-4 py-3 text-sm text-neutral-500">
        <BellOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
        <p>
          Las notificaciones están bloqueadas en tu navegador. Para activarlas,
          ve a la configuración de tu navegador y permite las notificaciones para
          este sitio.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-[#EDE6CA]/50 px-4 py-3">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-4 w-4 text-brand" />
        ) : (
          <BellOff className="h-4 w-4 text-neutral-400" />
        )}
        <div>
          <p className="text-sm font-medium text-neutral-700">
            Notificaciones push
          </p>
          <p className="text-xs text-neutral-400">
            {isSubscribed
              ? "Recibirás alertas de nuevas citas y recordatorios."
              : "Activa para recibir alertas en tu celular."}
          </p>
        </div>
      </div>

      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-sm border border-neutral-300 bg-white px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isSubscribed ? (
          "Desactivar"
        ) : (
          "Activar"
        )}
      </button>
    </div>
  );
}
