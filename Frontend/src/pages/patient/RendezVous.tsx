import { useEffect, useState } from "react";
import {
  getAppointments,
  getAppointmentDetail,
  cancelAppointment,
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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-green-200 bg-green-50 text-green-700";
    case "PENDING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "COMPLETED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-black/10 bg-white text-black";
  }
}

export default function RendezVous() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments("/appointments/");
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous.";
      setError(message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleShowDetails(appointmentId: number) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setInfoMessage("");

      const detail = await getAppointmentDetail(appointmentId);
      setSelectedAppointment(detail);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger les détails du rendez-vous.";
      setDetailError(message);
      setSelectedAppointment(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetails() {
    setSelectedAppointment(null);
    setDetailError("");
  }

  async function handleCancel(appointment: Appointment) {
    try {
      setActionLoadingId(appointment.id);
      setError("");
      setInfoMessage("");
      await cancelAppointment(appointment.id);

      if (selectedAppointment?.id === appointment.id) {
        const refreshedDetail = await getAppointmentDetail(appointment.id);
        setSelectedAppointment(refreshedDetail);
      }

      await loadAppointments();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d’annuler ce rendez-vous.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleReschedule() {
    setInfoMessage(
      "La reprogrammation n’est pas encore disponible dans cette version. Pour l’instant, annulez puis créez un nouveau rendez-vous.",
    );
  }

  function canCancel(status: string) {
    return status === "PENDING" || status === "CONFIRMED";
  }

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

        {infoMessage && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {infoMessage}
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
                appointments.map((a) => {
                  const isActionLoading = actionLoadingId === a.id;

                  return (
                    <tr key={a.id} className="border-b border-black/5">
                      <td className="py-3 pr-4">{a.appointment_date}</td>
                      <td className="py-3 pr-4">
                        {formatTime(a.start_time)} - {formatTime(a.end_time)}
                      </td>
                      <td className="py-3 pr-4">{a.service_name}</td>
                      <td className="py-3 pr-4">
                        Dr {a.practitioner_first_name}{" "}
                        {a.practitioner_last_name}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${getStatusBadgeClass(
                            a.status,
                          )}`}
                        >
                          {formatStatus(a.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleShowDetails(a.id)}
                            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                          >
                            Détails
                          </button>

                          <button
                            type="button"
                            onClick={handleReschedule}
                            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                          >
                            Reprogrammer
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCancel(a)}
                            disabled={!canCancel(a.status) || isActionLoading}
                            className="rounded-full bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionLoading ? "Annulation..." : "Annuler"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(detailLoading || detailError || selectedAppointment) && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Détails du rendez-vous</h2>
              <p className="mt-1 text-sm text-black/60">
                Informations complètes du rendez-vous et note SOAP associée.
              </p>
            </div>

            <button
              type="button"
              onClick={closeDetails}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
            >
              Fermer
            </button>
          </div>

          {detailLoading ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-black/[0.02] p-4 text-sm text-black/60">
              Chargement des détails...
            </div>
          ) : detailError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {detailError}
            </div>
          ) : selectedAppointment ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-black/70">
                    Informations générales
                  </h3>
                  <div className="space-y-2 text-sm text-black/80">
                    <p>
                      <span className="font-medium">Date :</span>{" "}
                      {selectedAppointment.appointment_date}
                    </p>
                    <p>
                      <span className="font-medium">Heure :</span>{" "}
                      {formatTime(selectedAppointment.start_time)} -{" "}
                      {formatTime(selectedAppointment.end_time)}
                    </p>
                    <p>
                      <span className="font-medium">Service :</span>{" "}
                      {selectedAppointment.service_name}
                    </p>
                    <p>
                      <span className="font-medium">Praticien :</span> Dr{" "}
                      {selectedAppointment.practitioner_first_name}{" "}
                      {selectedAppointment.practitioner_last_name}
                    </p>
                    <p>
                      <span className="font-medium">Statut :</span>{" "}
                      {formatStatus(selectedAppointment.status)}
                    </p>
                    <p>
                      <span className="font-medium">Motif :</span>{" "}
                      {selectedAppointment.reason?.trim() || "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-black/70">
                    Note SOAP
                  </h3>

                  {selectedAppointment.soap_note ? (
                    <div className="space-y-3 text-sm text-black/80">
                      <div>
                        <p className="font-medium">Subjective</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {selectedAppointment.soap_note.subjective || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Objective</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {selectedAppointment.soap_note.objective || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Assessment</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {selectedAppointment.soap_note.assessment || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Plan</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {selectedAppointment.soap_note.plan || "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-black/60">
                      Aucune note SOAP n’est disponible pour ce rendez-vous.
                    </div>
                  )}
                </div>
              </div>

              {canCancel(selectedAppointment.status) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCancel(selectedAppointment)}
                    disabled={actionLoadingId === selectedAppointment.id}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoadingId === selectedAppointment.id
                      ? "Annulation..."
                      : "Annuler ce rendez-vous"}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
