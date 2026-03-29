import { useEffect, useState } from "react";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

function formatTime(time: string) {
  return time.slice(0, 5);
}

function formatStatus(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmé";
    case "PENDING":
      return "En attente";
    case "CANCELLED":
      return "Annulé";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

export default function RendezVous() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Mes rendez-vous</h1>
        <p className="mt-2 text-black/60">
          Consultez vos rendez-vous à venir et gérez vos
          annulations/reprogrammations.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-black/60">
              <tr className="border-b border-black/10">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Heure</th>
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">Praticien</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3 pr-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="py-6 text-black/60" colSpan={6}>
                    Chargement des rendez-vous...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td className="py-6 text-black/60" colSpan={6}>
                    Aucun rendez-vous pour le moment.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="border-b border-black/5">
                    <td className="py-3 pr-4">{a.appointment_date}</td>
                    <td className="py-3 pr-4">{formatTime(a.start_time)}</td>
                    <td className="py-3 pr-4">{a.service_name}</td>
                    <td className="py-3 pr-4">
                      Dr {a.practitioner_first_name} {a.practitioner_last_name}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                        {formatStatus(a.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                        >
                          Reprogrammer
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
