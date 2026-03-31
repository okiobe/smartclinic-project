import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from "../../services/appointments.api";

type StatutRendezVous = "Confirmé" | "En attente" | "Annulé" | "Terminé";

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

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("fr-CA", {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const calendarStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameMonth(date: Date, currentMonth: Date) {
  return (
    date.getFullYear() === currentMonth.getFullYear() &&
    date.getMonth() === currentMonth.getMonth()
  );
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadAgenda() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments("/appointments/");
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l’agenda.";
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
    loadAgenda();
  }, []);

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    for (const appointment of appointments) {
      const key = appointment.appointment_date;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(appointment);
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    return grouped;
  }, [appointments]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  }

  function getBadgeClass(status: string) {
    switch (formatStatus(status)) {
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
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Agenda du praticien
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Consultez les rendez-vous dans une vue mensuelle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Précédent
            </button>

            <div className="min-w-[180px] text-center text-sm font-semibold capitalize text-slate-700">
              {getMonthLabel(currentMonth)}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Suivant
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              Chargement de l’agenda...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mer</div>
                <div>Jeu</div>
                <div>Ven</div>
                <div>Sam</div>
                <div>Dim</div>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendarDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const dayAppointments = appointmentsByDate[dateKey] ?? [];
                  const inCurrentMonth = isSameMonth(date, currentMonth);

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[170px] rounded-xl border p-2 ${
                        inCurrentMonth
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <div className="mb-2 text-sm font-semibold">
                        {date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayAppointments.length === 0 ? (
                          <div className="text-xs text-slate-400">
                            Aucun rendez-vous
                          </div>
                        ) : (
                          dayAppointments.slice(0, 3).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                            >
                              <div className="font-medium text-slate-700">
                                {formatTime(appointment.start_time)} -{" "}
                                {formatTime(appointment.end_time)}
                              </div>
                              <div className="truncate text-slate-600">
                                {appointment.patient_first_name}{" "}
                                {appointment.patient_last_name}
                              </div>
                              <div className="truncate text-slate-500">
                                {appointment.reason?.trim() ||
                                  appointment.service_name}
                              </div>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeClass(
                                    appointment.status,
                                  )}`}
                                >
                                  {formatStatus(appointment.status)}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                {appointment.status !== "CONFIRMED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusUpdate(
                                        appointment.id,
                                        "CONFIRMED",
                                      )
                                    }
                                    disabled={updatingId === appointment.id}
                                    className="rounded-md bg-green-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                  >
                                    Valider
                                  </button>
                                )}

                                {appointment.status !== "CANCELLED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusUpdate(
                                        appointment.id,
                                        "CANCELLED",
                                      )
                                    }
                                    disabled={updatingId === appointment.id}
                                    className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                  >
                                    Annuler
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-slate-500">
                            + {dayAppointments.length - 3} autre(s)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
