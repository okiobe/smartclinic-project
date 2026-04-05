import { useEffect, useMemo, useState } from "react";
import {
  getMyPractitionerAvailabilities,
  type AvailabilityRule,
} from "../../services/practitioners.api";

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function Disponibilites() {
  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAvailabilities() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyPractitionerAvailabilities();
      setAvailabilities(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des disponibilités.";
      setError(message);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const groupedAvailabilities = useMemo(() => {
    const grouped: Record<string, AvailabilityRule[]> = {};

    for (const item of availabilities) {
      const key = item.weekday_display;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(item);
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    return grouped;
  }, [availabilities]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Disponibilités</h1>
        <p className="mt-2 text-sm text-black/60">
          Voici les disponibilités définies par l’administrateur pour votre
          agenda.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        {loading ? (
          <p className="text-sm text-black/60">
            Chargement des disponibilités...
          </p>
        ) : availabilities.length === 0 ? (
          <p className="text-sm text-black/60">
            Aucune disponibilité définie pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAvailabilities).map(([day, items]) => (
              <div
                key={day}
                className="rounded-xl border border-black/10 bg-white p-4"
              >
                <h2 className="font-semibold">{day}</h2>

                <div className="mt-3 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-black/10 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {formatTime(item.start_time)} -{" "}
                          {formatTime(item.end_time)}
                        </div>

                        <div className="mt-1">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        Gestion effectuée par l’administrateur
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
