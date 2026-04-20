import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

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

function formatStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "CONFIRMED":
      return "Confirmé";
    case "CANCELLED":
      return "Annulé";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function TableauDeBord() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getAppointments("/appointments/");
        setAppointments(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du tableau de bord praticien.";
        setError(message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const today = getTodayDate();

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.appointment_date === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, today]);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();

    return [...appointments]
      .filter(
        (appointment) =>
          getAppointmentDateTime(appointment) >= now &&
          appointment.status !== "CANCELLED",
      )
      .sort((a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b))
      .slice(0, 5);
  }, [appointments]);

  const uniquePatientsCount = useMemo(() => {
    return new Set(appointments.map((appointment) => appointment.patient)).size;
  }, [appointments]);

  const soapReadyCount = useMemo(() => {
    return appointments.filter(hasSoapContent).length;
  }, [appointments]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Tableau de bord — Praticien</h1>
        <p className="mt-2 text-black/60">
          Accédez rapidement à votre horaire, à la rédaction des dossiers
          cliniques et aux outils d’IA.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/practitioner/schedule"
            className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            Voir mon horaire
          </Link>

          <Link
            to="/practitioner/today"
            className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
          >
            Rédiger les notes SOAP
          </Link>

          <Link
            to="/practitioner/medical-record"
            className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
          >
            Dossier médical
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
            Chargement du tableau de bord...
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <p className="text-sm text-black/60">Rendez-vous du jour</p>
              <p className="mt-2 text-3xl font-semibold">
                {todayAppointments.length}
              </p>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <p className="text-sm text-black/60">Patients suivis</p>
              <p className="mt-2 text-3xl font-semibold">
                {uniquePatientsCount}
              </p>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <p className="text-sm text-black/60">Notes SOAP disponibles</p>
              <p className="mt-2 text-3xl font-semibold">{soapReadyCount}</p>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Aujourd’hui</h2>
                <Link
                  to="/practitioner/today"
                  className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
                >
                  Ouvrir les rendez-vous du jour
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <p className="mt-4 text-sm text-black/60">
                  Aucun rendez-vous prévu aujourd’hui.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-xl border border-black/10 bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium">
                            {appointment.patient_first_name}{" "}
                            {appointment.patient_last_name}
                          </p>
                          <p className="text-sm text-black/60">
                            {formatTime(appointment.start_time)} -{" "}
                            {formatTime(appointment.end_time)}
                          </p>
                          <p className="text-sm text-black/60">
                            {appointment.reason?.trim() ||
                              appointment.service_name}
                          </p>
                        </div>

                        <span className="inline-flex w-fit rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/70">
                          {formatStatus(appointment.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <h2 className="text-lg font-semibold">Actions cliniques</h2>

              <div className="mt-4 grid gap-3">
                <Link
                  to="/practitioner/history"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                >
                  Consulter l’historique des rendez-vous
                </Link>

                <Link
                  to="/practitioner/medical-record"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                >
                  Consulter les dossiers médicaux des patients
                </Link>
              </div>

              <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
                <h3 className="text-sm font-semibold">Résumé</h3>
                <div className="mt-3 space-y-2 text-sm text-black/60">
                  <p>Rendez-vous à venir : {upcomingAppointments.length}</p>
                  <p>Patients suivis : {uniquePatientsCount}</p>
                  <p>Notes SOAP disponibles : {soapReadyCount}</p>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Prochains rendez-vous</h2>
              <Link
                to="/practitioner/schedule"
                className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
              >
                Voir l’agenda complet
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <p className="mt-4 text-sm text-black/60">
                Aucun rendez-vous à venir.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-medium">
                          {appointment.patient_first_name}{" "}
                          {appointment.patient_last_name}
                        </p>
                        <p className="text-sm text-black/60">
                          {formatDate(appointment.appointment_date)} à{" "}
                          {formatTime(appointment.start_time)}
                        </p>
                        <p className="text-sm text-black/60">
                          {appointment.reason?.trim() ||
                            appointment.service_name}
                        </p>
                      </div>

                      <span className="inline-flex w-fit rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/70">
                        {formatStatus(appointment.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
