import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

type PatientSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

function formatDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getAppointmentDateTime(appointment: Appointment) {
  return new Date(
    `${appointment.appointment_date}T${appointment.start_time}`,
  ).getTime();
}

function hasSoapContent(appointment: Appointment) {
  const soap = appointment.soap_note;

  return Boolean(
    soap &&
    (soap.subjective?.trim() ||
      soap.objective?.trim() ||
      soap.assessment?.trim() ||
      soap.plan?.trim()),
  );
}

export default function DossierMedical() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedicalData() {
      try {
        setLoading(true);
        setError("");

        const data = await getAppointments("/appointments/");
        const withSoap = data
          .filter(hasSoapContent)
          .sort(
            (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a),
          );

        setAppointments(withSoap);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du dossier médical praticien.";
        setError(message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadMedicalData();
  }, []);

  const patients = useMemo(() => {
    const map = new Map<number, PatientSummary>();

    appointments.forEach((appointment) => {
      if (!map.has(appointment.patient)) {
        map.set(appointment.patient, {
          id: appointment.patient,
          first_name: appointment.patient_first_name,
          last_name: appointment.patient_last_name,
          email: appointment.patient_email,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`,
      ),
    );
  }, [appointments]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];

    return appointments
      .filter((appointment) => appointment.patient === selectedPatientId)
      .sort((a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a));
  }, [appointments, selectedPatientId]);

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null;

    return (
      selectedPatientAppointments.find(
        (appointment) => appointment.id === selectedAppointmentId,
      ) ?? null
    );
  }, [selectedAppointmentId, selectedPatientAppointments]);

  function handleSelectPatient(patientId: number) {
    setSelectedPatientId((current) => {
      if (current === patientId) {
        setSelectedAppointmentId(null);
        return null;
      }

      return patientId;
    });
    setSelectedAppointmentId(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Dossier médical — Praticien
            </h1>
            <p className="mt-2 text-black/60">
              Consultez les patients suivis et l’ensemble des notes SOAP qui les
              concernent.
            </p>
          </div>

          <Link
            to="/practitioner/dashboard"
            className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <p className="text-sm text-black/60">
            Chargement du dossier médical...
          </p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Patients</h2>
              <span className="text-sm text-black/60">
                {patients.length} patient(s)
              </span>
            </div>

            {patients.length === 0 ? (
              <p className="mt-4 text-sm text-black/60">
                Aucun patient avec note SOAP disponible.
              </p>
            ) : (
              <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-2">
                {patients.map((patient) => {
                  const isSelected = selectedPatientId === patient.id;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-teal-400 bg-teal-50"
                          : "border-black/10 bg-white hover:bg-black/5"
                      }`}
                    >
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-black/60">
                        {patient.email}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
            {!selectedPatientId ? (
              <div>
                <h2 className="text-lg font-semibold">Notes SOAP</h2>
                <p className="mt-2 text-sm text-black/60">
                  Sélectionnez un patient pour afficher à droite l’ensemble des
                  notes SOAP qui le concernent.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Notes SOAP du patient
                  </h2>
                  <p className="mt-2 text-sm text-black/60">
                    Sélectionnez une note pour consulter son contenu complet.
                  </p>
                </div>

                {selectedPatientAppointments.length === 0 ? (
                  <p className="text-sm text-black/60">
                    Aucune note SOAP disponible pour ce patient.
                  </p>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
                      {selectedPatientAppointments.map((appointment) => {
                        const isSelected =
                          selectedAppointmentId === appointment.id;

                        return (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={() =>
                              setSelectedAppointmentId((current) =>
                                current === appointment.id
                                  ? null
                                  : appointment.id,
                              )
                            }
                            className={`w-full rounded-xl border p-4 text-left transition ${
                              isSelected
                                ? "border-teal-400 bg-teal-50"
                                : "border-black/10 bg-white hover:bg-black/5"
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {appointment.service_name}
                              </p>
                              <p className="text-sm text-black/60">
                                {formatDate(appointment.appointment_date)} à{" "}
                                {formatTime(appointment.start_time)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-black/10 bg-white p-5">
                      {!selectedAppointment ? (
                        <div className="text-sm text-black/60">
                          Sélectionnez une note dans la liste pour consulter son
                          contenu complet.
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {selectedAppointment.service_name}
                            </h3>
                            <p className="mt-1 text-sm text-black/60">
                              {formatDate(selectedAppointment.appointment_date)}{" "}
                              à {formatTime(selectedAppointment.start_time)}
                            </p>
                            <p className="text-sm text-black/60">
                              Patient : {selectedAppointment.patient_first_name}{" "}
                              {selectedAppointment.patient_last_name}
                            </p>
                          </div>

                          <div className="space-y-4 text-sm text-black/80">
                            <div>
                              <p className="font-medium text-black">
                                Subjectif
                              </p>
                              <p className="mt-1 whitespace-pre-wrap">
                                {selectedAppointment.soap_note?.subjective ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="font-medium text-black">Objectif</p>
                              <p className="mt-1 whitespace-pre-wrap">
                                {selectedAppointment.soap_note?.objective ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="font-medium text-black">
                                Évaluation
                              </p>
                              <p className="mt-1 whitespace-pre-wrap">
                                {selectedAppointment.soap_note?.assessment ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="font-medium text-black">Plan</p>
                              <p className="mt-1 whitespace-pre-wrap">
                                {selectedAppointment.soap_note?.plan || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
