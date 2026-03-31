import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from "../../services/appointments.api";

type StatutRendezVous = "Confirmé" | "En attente" | "Annulé" | "Terminé";

type RendezVous = {
  id: number;
  heureDebut: string;
  heureFin: string;
  patient: string;
  motif: string;
  statut: StatutRendezVous;
  rawStatus: AppointmentStatus;
};

function formatStatus(status: string): StatutRendezVous {
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
      return "En attente";
  }
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RendezVousJour() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const getBadgeClass = (statut: StatutRendezVous) => {
    switch (statut) {
      case "Confirmé":
        return "bg-green-100 text-green-700";
      case "En attente":
        return "bg-yellow-100 text-yellow-700";
      case "Annulé":
        return "bg-red-100 text-red-700";
      case "Terminé":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  async function loadRendezVousJour() {
    try {
      setLoading(true);
      setError("");

      const today = getTodayDate();
      const data = await getAppointments(`/appointments/?date=${today}`);
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous du jour.";
      setError(message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(
    appointmentId: number,
    status: AppointmentStatus,
  ) {
    try {
      setUpdatingId(appointmentId);
      setError("");

      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        status,
      );

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updatedAppointment : appointment,
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du statut.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    loadRendezVousJour();
  }, []);

  const rendezVous = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.appointment_date === getTodayDate())
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(
        (appointment): RendezVous => ({
          id: appointment.id,
          heureDebut: formatTime(appointment.start_time),
          heureFin: formatTime(appointment.end_time),
          patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
          motif: appointment.reason?.trim() || appointment.service_name,
          statut: formatStatus(appointment.status),
          rawStatus: appointment.status,
        }),
      );
  }, [appointments]);

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Chargement des rendez-vous du jour...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (rendezVous.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Aucun rendez-vous pour aujourd’hui.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Rendez-vous du jour
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Liste des rendez-vous prévus aujourd’hui uniquement.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Heure
              </th>
              <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Patient
              </th>
              <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Motif
              </th>
              <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Statut
              </th>
              <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {rendezVous.map((rdv) => (
              <tr key={rdv.id} className="hover:bg-slate-50">
                <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                  {rdv.heureDebut} - {rdv.heureFin}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-800">
                  {rdv.patient}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                  {rdv.motif}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                      rdv.statut,
                    )}`}
                  >
                    {rdv.statut}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {rdv.rawStatus !== "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(rdv.id, "CONFIRMED")}
                        disabled={updatingId === rdv.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Valider
                      </button>
                    )}

                    {rdv.rawStatus !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(rdv.id, "COMPLETED")}
                        disabled={updatingId === rdv.id}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Terminer
                      </button>
                    )}

                    {rdv.rawStatus !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(rdv.id, "CANCELLED")}
                        disabled={updatingId === rdv.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
