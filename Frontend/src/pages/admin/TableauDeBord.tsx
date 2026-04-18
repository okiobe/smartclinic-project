import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { getAdminServices } from "../../services/services.api";
import { getAdminPractitioners } from "../../services/practitioners.api";
import {
  getAppointments,
  type Appointment,
  type AppointmentStatus,
} from "../../services/appointments.api";
import {
  getAdminPatients,
  type AdminPatient,
} from "../../services/patients.api";

type DashboardStats = {
  services: number;
  practitioners: number;
  patients: number;
  appointments: number;
};

type PeriodFilter = "day" | "week" | "month" | "year";

const quickActions = [
  {
    title: "Gérer les services",
    description:
      "Créer, modifier ou supprimer les services proposés par la clinique.",
    to: "/admin/services",
    cta: "Ouvrir",
  },
  {
    title: "Gérer les praticiens",
    description:
      "Consulter les praticiens, modifier leurs profils et attribuer leurs services.",
    to: "/admin/practitioners",
    cta: "Ouvrir",
  },
  {
    title: "Gérer les patients",
    description:
      "Visualiser la liste des patients enregistrés dans la plateforme.",
    to: "/admin/patients",
    cta: "Ouvrir",
  },
  {
    title: "Paramètres",
    description: "Accéder aux réglages généraux de l’espace administrateur.",
    to: "/admin/settings",
    cta: "Ouvrir",
  },
];

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function parseDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateDisplay(value: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parseDateOnly(value));
}

function formatDateTimeDisplay(value?: string) {
  const date = parseDateTime(value);
  if (!date) return "Date indisponible";

  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getWeekStartFromInput(weekValue: string) {
  const [yearStr, weekStr] = weekValue.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);

  if (!year || !week) return null;

  const january4 = new Date(year, 0, 4);
  const day = january4.getDay() || 7;
  const mondayOfWeek1 = new Date(january4);
  mondayOfWeek1.setDate(january4.getDate() - day + 1);

  const start = new Date(mondayOfWeek1);
  start.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  start.setHours(0, 0, 0, 0);

  return start;
}

function formatWeekLabel(weekValue: string) {
  const start = getWeekStartFromInput(weekValue);
  if (!start) return "Semaine invalide";

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(start)} au ${formatter.format(end)}`;
}

function matchesSelectedPeriod(
  appointment: Appointment,
  period: PeriodFilter,
  selectedDay: string,
  selectedWeek: string,
  selectedMonth: string,
  selectedYear: string,
) {
  const appointmentDate = parseDateOnly(appointment.appointment_date);

  if (period === "day") {
    if (!selectedDay) return true;
    return appointment.appointment_date === selectedDay;
  }

  if (period === "week") {
    if (!selectedWeek) return true;

    const start = getWeekStartFromInput(selectedWeek);
    if (!start) return false;

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return appointmentDate >= start && appointmentDate < end;
  }

  if (period === "month") {
    if (!selectedMonth) return true;

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;

    if (Number.isNaN(year) || Number.isNaN(monthIndex)) return false;

    return (
      appointmentDate.getFullYear() === year &&
      appointmentDate.getMonth() === monthIndex
    );
  }

  if (!selectedYear) return true;

  return appointmentDate.getFullYear() === Number(selectedYear);
}

function getStatusCount(
  appointments: Appointment[],
  status: AppointmentStatus,
): number {
  return appointments.filter((appointment) => appointment.status === status)
    .length;
}

function getAvailableYears(appointments: Appointment[]) {
  const years = new Set<number>();

  appointments.forEach((appointment) => {
    const year = parseDateOnly(appointment.appointment_date).getFullYear();
    years.add(year);
  });

  return Array.from(years).sort((a, b) => b - a);
}

export default function TableauDeBord() {
  const [stats, setStats] = useState<DashboardStats>({
    services: 0,
    practitioners: 0,
    patients: 0,
    appointments: 0,
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<AdminPatient[]>([]);

  const today = new Date();
  const initialDay = today.toISOString().slice(0, 10);
  const initialMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}`;
  const initialYear = String(today.getFullYear());

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("month");
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [services, practitioners, patientsData, appointmentsData] =
          await Promise.all([
            getAdminServices(),
            getAdminPractitioners(),
            getAdminPatients(),
            getAppointments(),
          ]);

        setStats({
          services: services.length,
          practitioners: practitioners.length,
          patients: patientsData.length,
          appointments: appointmentsData.length,
        });

        setPatients(patientsData);
        setAppointments(appointmentsData);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du tableau de bord admin.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const availableYears = useMemo(
    () => getAvailableYears(appointments),
    [appointments],
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) =>
      matchesSelectedPeriod(
        appointment,
        selectedPeriod,
        selectedDay,
        selectedWeek,
        selectedMonth,
        selectedYear,
      ),
    );
  }, [
    appointments,
    selectedPeriod,
    selectedDay,
    selectedWeek,
    selectedMonth,
    selectedYear,
  ]);

  const statusCards = useMemo(
    () => [
      {
        label: "En attente",
        value: loading
          ? "--"
          : String(getStatusCount(filteredAppointments, "PENDING")),
        help: "Rendez-vous en attente",
      },
      {
        label: "Confirmés",
        value: loading
          ? "--"
          : String(getStatusCount(filteredAppointments, "CONFIRMED")),
        help: "Rendez-vous confirmés",
      },
      {
        label: "Terminés",
        value: loading
          ? "--"
          : String(getStatusCount(filteredAppointments, "COMPLETED")),
        help: "Rendez-vous complétés",
      },
      {
        label: "Annulés",
        value: loading
          ? "--"
          : String(getStatusCount(filteredAppointments, "CANCELLED")),
        help: "Rendez-vous annulés",
      },
    ],
    [filteredAppointments, loading],
  );

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const dateA = parseDateTime(a.created_at)?.getTime() ?? 0;
        const dateB = parseDateTime(b.created_at)?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [appointments]);

  const latestPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => {
        const dateA = parseDateTime(a.created_at)?.getTime() ?? 0;
        const dateB = parseDateTime(b.created_at)?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [patients]);

  const overviewStats = [
    {
      label: "Services",
      value: loading ? "--" : String(stats.services),
      help: "Nombre total de services",
    },
    {
      label: "Praticiens",
      value: loading ? "--" : String(stats.practitioners),
      help: "Nombre total de praticiens",
    },
    {
      label: "Patients",
      value: loading ? "--" : String(stats.patients),
      help: "Nombre total de patients",
    },
    {
      label: "Rendez-vous",
      value: loading ? "--" : String(stats.appointments),
      help: "Nombre total de rendez-vous",
    },
  ];

  function renderPreciseFilter() {
    if (selectedPeriod === "day") {
      return (
        <input
          type="date"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#0f172a]"
        />
      );
    }

    if (selectedPeriod === "week") {
      return (
        <input
          type="week"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#0f172a]"
        />
      );
    }

    if (selectedPeriod === "month") {
      return (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#0f172a]"
        />
      );
    }

    return (
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#0f172a]"
      >
        {availableYears.length > 0 ? (
          availableYears.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))
        ) : (
          <option value={selectedYear}>{selectedYear}</option>
        )}
      </select>
    );
  }

  function renderActiveFilterLabel() {
    if (selectedPeriod === "day") {
      return selectedDay || "Jour non sélectionné";
    }

    if (selectedPeriod === "week") {
      return selectedWeek
        ? formatWeekLabel(selectedWeek)
        : "Semaine non sélectionnée";
    }

    if (selectedPeriod === "month") {
      return selectedMonth || "Mois non sélectionné";
    }

    return selectedYear || "Année non sélectionnée";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2b6cb0]">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0f172a]">
              Tableau de bord admin
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-black/60">
              Bienvenue dans l’espace d’administration de SmartClinic. Utilisez
              ce tableau de bord pour accéder rapidement aux modules principaux
              de gestion.
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b6cb0]/15 bg-[#2b6cb0]/5 px-4 py-3 text-sm text-[#0f172a]">
            <p className="font-medium">Vue d’ensemble</p>
            <p className="mt-1 text-black/60">
              Données globales de la plateforme.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm"
          >
            <p className="text-sm text-black/60">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#0f172a]">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-black/50">{item.help}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">
              Statistiques par statut
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Répartition des rendez-vous par statut pour la période précise
              sélectionnée.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[#0f172a]">
                Type de filtre
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(e.target.value as PeriodFilter)
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#0f172a]"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[#0f172a]">
                Valeur
              </label>
              {renderPreciseFilter()}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-black/10 bg-[#fcfcfb] px-4 py-3 text-sm text-black/60">
          Filtre actif :{" "}
          <span className="font-medium text-[#0f172a]">
            {renderActiveFilterLabel()}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-5"
            >
              <p className="text-sm text-black/60">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#0f172a]">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-black/50">{item.help}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Accès rapides
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Accédez directement aux principaux espaces de gestion.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <div
              key={action.to}
              className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-5"
            >
              <h3 className="text-base font-semibold text-[#0f172a]">
                {action.title}
              </h3>
              <p className="mt-2 text-sm text-black/60">{action.description}</p>

              <div className="mt-4">
                <Link
                  to={action.to}
                  className="inline-flex items-center rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {action.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a]">
              Derniers rendez-vous enregistrés
            </h2>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-black/60">
              Chargement des rendez-vous...
            </p>
          ) : recentAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">
              Aucun rendez-vous récent disponible.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-black/10 bg-[#fcfcfb] p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0f172a]">
                      {appointment.patient_first_name}{" "}
                      {appointment.patient_last_name}
                    </p>
                    <p className="text-sm text-black/60">
                      {appointment.service_name} •{" "}
                      {appointment.practitioner_first_name}{" "}
                      {appointment.practitioner_last_name}
                    </p>
                    <p className="text-xs text-black/50">
                      Prévu le {formatDateDisplay(appointment.appointment_date)}{" "}
                      à {appointment.start_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-black/50">
                      Créé le {formatDateTimeDisplay(appointment.created_at)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#0f172a]">
                      Statut : {appointment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a]">
              Derniers patients inscrits
            </h2>
            <Link
              to="/admin/patients"
              className="text-sm font-medium text-[#2b6cb0] hover:underline"
            >
              Voir la liste
            </Link>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-black/60">
              Chargement des patients...
            </p>
          ) : latestPatients.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">
              Aucun patient enregistré.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {latestPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-xl border border-black/10 bg-[#fcfcfb] p-4"
                >
                  <p className="text-sm font-medium text-[#0f172a]">
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-sm text-black/60">{patient.email}</p>
                  <p className="mt-1 text-xs text-black/50">
                    Inscrit le {formatDateTimeDisplay(patient.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
