import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

const APPOINTMENTS_ROUTE = "/patient/appointments";
const PROFILE_ROUTE = "/patient/profile";
const BOOKING_ROUTE = "/booking";
const MEDICAL_RECORD_ROUTE = "/patient/medical-record";

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

function getAppointmentDateTime(appointment: Appointment) {
  return new Date(
    `${appointment.appointment_date}T${appointment.start_time}`,
  ).getTime();
}

function getSoapNote(appointment: Appointment): {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
} | null {
  const raw = (
    appointment as Appointment & {
      soap_note?: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
      } | null;
    }
  ).soap_note;

  return raw ?? null;
}

function hasSoapContent(appointment: Appointment) {
  const soap = getSoapNote(appointment);

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
            : "Erreur lors du chargement du tableau de bord.";
        setError(message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b),
    );
  }, [appointments]);

  const now = Date.now();

  const upcomingAppointments = useMemo(() => {
    return sortedAppointments
      .filter(
        (appointment) =>
          getAppointmentDateTime(appointment) >= now &&
          appointment.status !== "CANCELLED",
      )
      .slice(0, 3);
  }, [sortedAppointments, now]);

  const nextAppointment = upcomingAppointments[0];

  const soapAppointments = useMemo(() => {
    return [...sortedAppointments]
      .filter(hasSoapContent)
      .sort((a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a));
  }, [sortedAppointments]);

  const latestSoapAppointment = soapAppointments[0] ?? null;
  const soapCount = soapAppointments.length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Tableau de bord — Patient</h1>
        <p className="mt-2 text-black/60">
          Accédez rapidement à vos rendez-vous, à votre dossier médical et à
          votre profil.
        </p>

        <div className="mt-6">
          <Link
            to={BOOKING_ROUTE}
            className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            Prendre un rendez-vous
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
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Rendez-vous à venir</h2>
                <Link
                  to={APPOINTMENTS_ROUTE}
                  className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
                >
                  Voir mes rendez-vous
                </Link>
              </div>

              {!nextAppointment ? (
                <div className="mt-4 rounded-xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-black/60">
                  Aucun rendez-vous à venir pour le moment.
                </div>
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
                            {appointment.service_name}
                          </p>
                          <p className="text-sm text-black/60">
                            {formatDate(appointment.appointment_date)} à{" "}
                            {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-sm text-black/60">
                            Dr {appointment.practitioner_first_name}{" "}
                            {appointment.practitioner_last_name}
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
              <h2 className="text-lg font-semibold">Mon profil</h2>
              <p className="mt-2 text-sm text-black/60">
                Mettez à jour vos informations personnelles et gardez votre
                dossier patient à jour.
              </p>

              <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
                <div className="space-y-2 text-sm text-black/60">
                  <p>Vérifiez vos coordonnées.</p>
                  <p>Gardez vos informations personnelles à jour.</p>
                </div>

                <div className="mt-4">
                  <Link
                    to={PROFILE_ROUTE}
                    className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
                  >
                    Gérer mon profil
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Mon dossier médical</h2>
                <Link
                  to={MEDICAL_RECORD_ROUTE}
                  className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
                >
                  Consulter mon dossier médical
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-white p-4">
                    <p className="text-sm text-black/60">
                      Notes SOAP disponibles
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{soapCount}</p>
                  </div>

                  <div className="rounded-xl border border-black/10 bg-white p-4">
                    <p className="text-sm text-black/60">
                      Dernier compte rendu
                    </p>
                    <p className="mt-2 text-sm font-medium text-black">
                      {latestSoapAppointment
                        ? formatDate(latestSoapAppointment.appointment_date)
                        : "Aucun pour le moment"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-black/60">
                    Consultez les comptes rendus médicaux et les notes SOAP qui
                    vous sont destinées.
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    to={MEDICAL_RECORD_ROUTE}
                    className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Consulter mon dossier médical
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <h2 className="text-lg font-semibold">
                Dernière note SOAP disponible
              </h2>

              {!latestSoapAppointment ? (
                <p className="mt-4 text-sm text-black/60">
                  Aucune note SOAP disponible pour le moment.
                </p>
              ) : (
                <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
                  <p className="font-medium">
                    {latestSoapAppointment.service_name}
                  </p>
                  <p className="mt-1 text-sm text-black/60">
                    {formatDate(latestSoapAppointment.appointment_date)} à{" "}
                    {formatTime(latestSoapAppointment.start_time)}
                  </p>
                  <p className="text-sm text-black/60">
                    Dr {latestSoapAppointment.practitioner_first_name}{" "}
                    {latestSoapAppointment.practitioner_last_name}
                  </p>

                  <div className="mt-4 space-y-3 text-sm text-black/70">
                    {getSoapNote(latestSoapAppointment)?.subjective && (
                      <div>
                        <p className="font-medium text-black">Subjectif</p>
                        <p className="mt-1 line-clamp-3">
                          {getSoapNote(latestSoapAppointment)?.subjective}
                        </p>
                      </div>
                    )}

                    {getSoapNote(latestSoapAppointment)?.assessment && (
                      <div>
                        <p className="font-medium text-black">Évaluation</p>
                        <p className="mt-1 line-clamp-3">
                          {getSoapNote(latestSoapAppointment)?.assessment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
