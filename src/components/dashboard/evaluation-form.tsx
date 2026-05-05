"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationFormProps {
  appointmentId: string;
  therapistName: string;
  onSuccess?: () => void;
}

export function EvaluationForm({
  appointmentId,
  therapistName,
  onSuccess,
}: EvaluationFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointmentId,
          rating,
          comment: comment.trim() || null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar evaluación");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-800">
              ¡Gracias por tu evaluación!
            </h3>
            <p className="text-neutral-600">
              Tu opinión nos ayuda a mejorar nuestro servicio.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Evalúa tu sesión con {therapistName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-neutral-600">
              ¿Cómo calificarías tu experiencia?
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-10 w-10 transition-colors",
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-neutral-200"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-neutral-500 h-5">
              {rating === 1 && "Muy mala"}
              {rating === 2 && "Mala"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Buena"}
              {rating === 5 && "Excelente"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia... (opcional)"
              rows={4}
            />
          </div>

          {/* Anonymous option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">
              Enviar de forma anónima
            </span>
          </label>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || rating === 0}>
            {loading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar evaluación
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
