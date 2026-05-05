"use client";

import { useState, useEffect, useCallback } from "react";
import { Therapist, EvaluationWithRelations } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, MessageSquare, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationsPageProps {
  therapist: Therapist;
}

export function EvaluationsPage({ therapist }: EvaluationsPageProps) {
  const [evaluations, setEvaluations] = useState<EvaluationWithRelations[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluations");
      const data = await response.json();
      
      if (data.evaluations) {
        setEvaluations(data.evaluations);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    evaluations.forEach((e) => {
      distribution[e.rating - 1]++;
    });
    return distribution.reverse();
  };

  const ratingDistribution = getRatingDistribution();
  const totalReviews = evaluations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">
            Evaluaciones
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Retroalimentación de tus pacientes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-500">
          Cargando evaluaciones...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Calificación promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-neutral-800">
                    {averageRating ? averageRating.toFixed(1) : "—"}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-5 w-5",
                          averageRating && star <= Math.round(averageRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-neutral-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Total de evaluaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold text-neutral-800">
                  {totalReviews}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">
                  Distribución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {ratingDistribution.map((count, i) => {
                    const stars = 5 - i;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs w-3">{stars}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 w-8">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evaluations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Últimas evaluaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aún no tienes evaluaciones</p>
                  <p className="text-sm mt-1">
                    Las evaluaciones aparecerán cuando los pacientes califiquen sus citas completadas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                            {evaluation.is_anonymous ? (
                              <User className="h-5 w-5 text-neutral-400" />
                            ) : (
                              <span className="text-brand font-semibold">
                                {evaluation.patient?.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800">
                              {evaluation.is_anonymous
                                ? "Paciente anónimo"
                                : evaluation.patient?.name || "Paciente"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= evaluation.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-neutral-200"
                                  )}
                                />
                              ))}
                            </div>
                            {evaluation.comment && (
                              <p className="mt-2 text-neutral-600">
                                "{evaluation.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(evaluation.created_at)}
                          </div>
                          {evaluation.appointment && (
                            <p className="text-xs mt-1">
                              Cita del {formatDate(evaluation.appointment.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
