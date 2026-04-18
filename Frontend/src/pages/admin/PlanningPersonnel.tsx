import { useEffect, useMemo, useState, Fragment } from "react";
import {
  getAdminPractitioners,
  getAdminPractitionerAvailabilities,
  type Practitioner,
  type AvailabilityRule,
} from "../../services/practitioners.api";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

type ViewMode = "day" | "week" | "month";

type PractitionerPlanning = {
  practitioner: Practitioner;
  availabilities: AvailabilityRule[];
};

type PlanningColumn = {
  key: string;
  label: string;
  subLabel: string;
  weekday: number;
  dateKey?: string;
};

const weekdayLabels = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 7, label: "Dimanche", short: "Dim" },
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function getWeekDates(selectedDate: string) {
  const base = new Date(`${selectedDate}T00:00:00`);
  const start = getStartOfWeek(base);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getIsoWeekday(date: Date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function formatDateHeader(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAppointmentStatus(status: string) {
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

function getAppointmentBadgeClass(status: string) {
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
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getMonthColumns(selectedDate: string): PlanningColumn[] {
  const base = new Date(`${selectedDate}T00:00:00`);
  const monthLabel = formatMonthLabel(base);

  return weekdayLabels.map((item) => ({
    key: `month-${item.value}`,
    label: item.short,
    subLabel: monthLabel,
    weekday: item.value,
  }));
}

function getDayColumns(selectedDate: string): PlanningColumn[] {
  const date = new Date(`${selectedDate}T00:00:00`);
  const weekday = getIsoWeekday(date);
  const weekdayInfo = weekdayLabels.find((item) => item.value === weekday);

  return [
    {
      key: selectedDate,
      label: weekdayInfo?.label ?? "Jour",
      subLabel: formatDateHeader(date),
      weekday,
      dateKey: selectedDate,
    },
  ];
}

function getWeekColumns(selectedDate: string): PlanningColumn[] {
  return getWeekDates(selectedDate).map((date) => {
    const weekday = getIsoWeekday(date);
    const weekdayInfo = weekdayLabels.find((item) => item.value === weekday);

    return {
      key: toDateKey(date),
      label: weekdayInfo?.short ?? "Jour",
      subLabel: formatDateHeader(date),
      weekday,
      dateKey: toDateKey(date),
    };
  });
}

function getStatusCounts(appointments: Appointment[]) {
  return {
    pending: appointments.filter((item) => item.status === "PENDING").length,
    confirmed: appointments.filter((item) => item.status === "CONFIRMED")
      .length,
    completed: appointments.filter((item) => item.status === "COMPLETED")
      .length,
    cancelled: appointments.filter((item) => item.status === "CANCELLED")
      .length,
  };
}

export default function PlanningPersonnel() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedPractitionerId, setSelectedPractitionerId] =
    useState<string>("all");

  const [planning, setPlanning] = useState<PractitionerPlanning[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlanningData() {
      try {
        setLoading(true);
        setError("");

        const practitioners = await getAdminPractitioners();

        const availabilitiesList = await Promise.all(
          practitioners.map((practitioner) =>
            getAdminPractitionerAvailabilities(practitioner.id),
          ),
        );

        const appointmentsData = await getAppointments();

        const mappedPlanning = practitioners.map((practitioner, index) => ({
          practitioner,
          availabilities: availabilitiesList[index] ?? [],
        }));

        setPlanning(mappedPlanning);
        setAppointments(appointmentsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du planning du personnel.",
        );
        setPlanning([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlanningData();
  }, []);

  const filteredPlanning = useMemo(() => {
    if (selectedPractitionerId === "all") {
      return planning;
    }

    return planning.filter(
      (item) => String(item.practitioner.id) === selectedPractitionerId,
    );
  }, [planning, selectedPractitionerId]);

  const columns = useMemo(() => {
    if (viewMode === "day") {
      return getDayColumns(selectedDate);
    }

    if (viewMode === "week") {
      return getWeekColumns(selectedDate);
    }

    return getMonthColumns(selectedDate);
  }, [viewMode, selectedDate]);

  const selectedMonthDate = useMemo(
    () => new Date(`${selectedDate}T00:00:00`),
    [selectedDate],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2b6cb0]">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0f172a]">
              Planning global du personnel
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Vue synthétique des disponibilités et rendez-vous du personnel,
              avec filtre rapide par praticien et par période.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedPractitionerId}
              onChange={(e) => setSelectedPractitionerId(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
            >
              <option value="all">Tous les praticiens</option>
              {planning.map((item) => (
                <option
                  key={item.practitioner.id}
                  value={String(item.practitioner.id)}
                >
                  {item.practitioner.first_name} {item.practitioner.last_name}
                </option>
              ))}
            </select>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-black/60">Chargement du planning...</p>
        ) : filteredPlanning.length === 0 ? (
          <p className="text-sm text-black/60">Aucun praticien trouvé.</p>
        ) : (
          <div className="w-full">
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `180px repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="border-b border-black/10 bg-white/95 px-3 py-3 text-sm font-semibold text-[#0f172a]">
                Personnel
              </div>

              {columns.map((column) => (
                <div
                  key={column.key}
                  className="border-b border-l border-black/10 bg-white/95 px-2 py-3 text-center"
                >
                  <div className="text-xs font-semibold text-[#0f172a]">
                    {column.label}
                  </div>
                  <div className="text-[11px] text-black/50">
                    {column.subLabel}
                  </div>
                </div>
              ))}

              {filteredPlanning.map((row) => (
                <Fragment key={row.practitioner.id}>
                  <div className="border-t border-black/10 bg-white/95 px-3 py-3">
                    <div className="text-sm font-semibold text-[#0f172a]">
                      {row.practitioner.first_name} {row.practitioner.last_name}
                    </div>
                    <div className="text-xs text-black/60">
                      {row.practitioner.specialty || "Aucune spécialité"}
                    </div>
                    {row.practitioner.clinic_name && (
                      <div className="mt-1 text-[11px] text-black/50">
                        {row.practitioner.clinic_name}
                      </div>
                    )}
                  </div>

                  {columns.map((column) => {
                    const dayAvailabilities = row.availabilities
                      .filter(
                        (availability) =>
                          availability.weekday === column.weekday &&
                          availability.is_active,
                      )
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));

                    let cellAppointments: Appointment[] = [];

                    if (viewMode === "day" || viewMode === "week") {
                      cellAppointments = appointments
                        .filter(
                          (appointment) =>
                            appointment.practitioner === row.practitioner.id &&
                            appointment.appointment_date === column.dateKey,
                        )
                        .sort((a, b) =>
                          a.start_time.localeCompare(b.start_time),
                        );
                    } else {
                      cellAppointments = appointments
                        .filter((appointment) => {
                          const appointmentDate = parseDateOnly(
                            appointment.appointment_date,
                          );

                          return (
                            appointment.practitioner === row.practitioner.id &&
                            appointmentDate.getFullYear() ===
                              selectedMonthDate.getFullYear() &&
                            appointmentDate.getMonth() ===
                              selectedMonthDate.getMonth() &&
                            getIsoWeekday(appointmentDate) === column.weekday
                          );
                        })
                        .sort((a, b) =>
                          a.start_time.localeCompare(b.start_time),
                        );
                    }

                    const statusCounts = getStatusCounts(cellAppointments);

                    return (
                      <div
                        key={`${row.practitioner.id}-${column.key}`}
                        className="min-h-[110px] border-l border-t border-black/10 bg-white px-2 py-2"
                      >
                        <div className="space-y-2">
                          {dayAvailabilities.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-500">
                              Aucune disponibilité
                            </div>
                          ) : (
                            dayAvailabilities.map((availability) => (
                              <div
                                key={`availability-${availability.id}`}
                                className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-2 text-[11px] text-teal-800"
                              >
                                <div className="font-medium">Disponible</div>
                                <div>
                                  {availability.start_time.slice(0, 5)} -{" "}
                                  {availability.end_time.slice(0, 5)}
                                </div>
                              </div>
                            ))
                          )}

                          {viewMode === "month" ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-700">
                              <div className="font-medium">
                                {cellAppointments.length} rendez-vous ce mois
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                                <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-700">
                                  Attente : {statusCounts.pending}
                                </span>
                                <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                                  Confirmés : {statusCounts.confirmed}
                                </span>
                                <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                                  Terminés : {statusCounts.completed}
                                </span>
                                <span className="rounded bg-red-100 px-2 py-1 text-red-700">
                                  Annulés : {statusCounts.cancelled}
                                </span>
                              </div>
                            </div>
                          ) : (
                            cellAppointments.map((appointment) => (
                              <div
                                key={`appointment-${appointment.id}`}
                                className={`rounded-lg border px-2 py-2 text-[11px] ${getAppointmentBadgeClass(
                                  appointment.status,
                                )}`}
                              >
                                <div className="font-semibold">
                                  {appointment.start_time.slice(0, 5)} -{" "}
                                  {appointment.end_time.slice(0, 5)}
                                </div>
                                <div className="truncate">
                                  {appointment.patient_first_name}{" "}
                                  {appointment.patient_last_name}
                                </div>
                                <div className="truncate">
                                  {appointment.service_name}
                                </div>
                                <div className="mt-1 font-medium">
                                  {formatAppointmentStatus(appointment.status)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
