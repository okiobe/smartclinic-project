import { useEffect, useState } from "react";
import {
  getAdminPatients,
  deleteAdminPatient,
  type AdminPatient,
} from "../../services/patients.api";
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

export default function Patients() {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(
    null,
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminPatients();
      setPatients(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des patients.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientAppointments(patientId: number) {
    try {
      setLoadingAppointments(true);
      setError("");
      const data = await getAppointments(`/appointments/?patient=${patientId}`);
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous du patient.";
      setError(message);
    } finally {
      setLoadingAppointments(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient && showHistory) {
      loadPatientAppointments(selectedPatient.id);
    } else {
      setAppointments([]);
    }
  }, [selectedPatient, showHistory]);

  function handleSelectPatient(patient: AdminPatient) {
    setSelectedPatient(patient);
    setShowHistory(true);
    setMessage("");
    setError("");
  }

  function handleCloseHistory() {
    setShowHistory(false);
    setSelectedPatient(null);
    setAppointments([]);
    setMessage("");
    setError("");
  }

  async function handleDeletePatient() {
    if (!selectedPatient) return;

    const confirmed = window.confirm(
      `Supprimer le patient ${selectedPatient.first_name} ${selectedPatient.last_name} ?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await deleteAdminPatient(selectedPatient.id);

      setMessage("Patient supprimé avec succès.");

      const updatedPatients = patients.filter(
        (p) => p.id !== selectedPatient.id,
      );
      setPatients(updatedPatients);
      setSelectedPatient(null);
      setShowHistory(false);
      setAppointments([]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du patient.";
      setError(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Patients — Administrateur</h1>
        <p className="mt-2 text-black/60">
          Consultez les patients du système et leurs rendez-vous, sans accès au
          dossier médical.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <h2 className="text-lg font-semibold">Liste des patients</h2>

          {loading ? (
            <p className="mt-4 text-sm text-black/60">
              Chargement des patients...
            </p>
          ) : patients.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">Aucun patient trouvé.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {patients.map((patient) => {
                const isSelected =
                  showHistory && selectedPatient?.id === patient.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-teal-500 bg-teal-50"
                        : "border-black/10 bg-white hover:bg-black/5"
                    }`}
                  >
                    <div className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-black/60">{patient.email}</div>
                    <div className="text-xs text-black/50">
                      Créé le {patient.created_at.slice(0, 10)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          {!showHistory || !selectedPatient ? (
            <div>
              <h2 className="text-lg font-semibold">Historique du patient</h2>
              <p className="mt-2 text-sm text-black/60">
                Sélectionnez un patient dans la liste pour afficher son
                historique de rendez-vous.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Patient sélectionné</h2>
                  <div className="mt-2 text-sm text-black/60">
                    <div>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                    <div>{selectedPatient.email}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseHistory}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    onClick={handleDeletePatient}
                    className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-base font-semibold">
                  Rendez-vous du patient
                </h3>

                {loadingAppointments ? (
                  <p className="mt-4 text-sm text-black/60">
                    Chargement des rendez-vous...
                  </p>
                ) : appointments.length === 0 ? (
                  <p className="mt-4 text-sm text-black/60">
                    Aucun rendez-vous trouvé pour ce patient.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-black/60">
                        <tr className="border-b border-black/10">
                          <th className="py-3 pr-4">Date</th>
                          <th className="py-3 pr-4">Heure</th>
                          <th className="py-3 pr-4">Service</th>
                          <th className="py-3 pr-4">Praticien</th>
                          <th className="py-3 pr-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr
                            key={appointment.id}
                            className="border-b border-black/5"
                          >
                            <td className="py-3 pr-4">
                              {appointment.appointment_date}
                            </td>
                            <td className="py-3 pr-4">
                              {formatTime(appointment.start_time)}
                            </td>
                            <td className="py-3 pr-4">
                              {appointment.service_name}
                            </td>
                            <td className="py-3 pr-4">
                              Dr {appointment.practitioner_first_name}{" "}
                              {appointment.practitioner_last_name}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                                {formatStatus(appointment.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
