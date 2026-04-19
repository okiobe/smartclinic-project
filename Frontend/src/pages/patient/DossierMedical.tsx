import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  type Appointment,
} from "../../services/appointments.api";

type FilterPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR";

const ITEMS_PER_PAGE = 5;

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

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthValue() {
  return getTodayDateValue().slice(0, 7);
}

function getCurrentYearValue() {
  return String(new Date().getFullYear());
}

function getCurrentWeekValue() {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekRangeFromValue(weekValue: string) {
  const [yearPart, weekPart] = weekValue.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);

  if (!year || !week) return null;

  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7;
  const monday = new Date(simple);

  if (dayOfWeek <= 4) {
    monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  } else {
    monday.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
  }

  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function matchesSelectedPeriod(
  dateString: string,
  period: FilterPeriod,
  selectedValue: string,
) {
  const target = new Date(`${dateString}T00:00:00`);

  if (period === "DAY") {
    return dateString === selectedValue;
  }

  if (period === "MONTH") {
    return dateString.slice(0, 7) === selectedValue;
  }

  if (period === "YEAR") {
    return dateString.slice(0, 4) === selectedValue;
  }

  const range = getWeekRangeFromValue(selectedValue);
  if (!range) return false;

  return target >= range.start && target <= range.end;
}

function getPeriodLabel(period: FilterPeriod) {
  switch (period) {
    case "DAY":
      return "Jour";
    case "WEEK":
      return "Semaine";
    case "MONTH":
      return "Mois";
    case "YEAR":
      return "Année";
    default:
      return period;
  }
}

function getDefaultFilterValue(period: FilterPeriod) {
  switch (period) {
    case "DAY":
      return getTodayDateValue();
    case "WEEK":
      return getCurrentWeekValue();
    case "MONTH":
      return getCurrentMonthValue();
    case "YEAR":
      return getCurrentYearValue();
    default:
      return getCurrentMonthValue();
  }
}

export default function DossierMedical() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("MONTH");
  const [filterValue, setFilterValue] = useState<string>(
    getDefaultFilterValue("MONTH"),
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedicalRecords() {
      try {
        setLoading(true);
        setError("");

        const data = await getAppointments("/appointments/");
        const withSoapNotes = data
          .filter(hasSoapContent)
          .sort(
            (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a),
          );

        setAppointments(withSoapNotes);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du dossier médical.";
        setError(message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadMedicalRecords();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) =>
      matchesSelectedPeriod(
        appointment.appointment_date,
        filterPeriod,
        filterValue,
      ),
    );
  }, [appointments, filterPeriod, filterValue]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE),
  );

  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, page]);

  const summary = useMemo(() => {
    return {
      totalNotes: filteredAppointments.length,
      latestNoteDate:
        filteredAppointments.length > 0
          ? formatDate(filteredAppointments[0].appointment_date)
          : "Aucune",
    };
  }, [filteredAppointments]);

  useEffect(() => {
    setFilterValue(getDefaultFilterValue(filterPeriod));
    setPage(1);
    setSelectedAppointment(null);
  }, [filterPeriod]);

  useEffect(() => {
    setPage(1);
    setSelectedAppointment(null);
  }, [filterValue]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dossier médical</h1>
            <p className="mt-2 text-black/60">
              Consultez l’ensemble des notes SOAP et comptes rendus médicaux qui
              vous sont destinés.
            </p>
          </div>

          <Link
            to="/patient/dashboard"
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
        <>
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <h2 className="text-lg font-semibold">Résumé médical</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-sm text-black/60">
                    Notes SOAP ({getPeriodLabel(filterPeriod)})
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {summary.totalNotes}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-sm text-black/60">Dernière note</p>
                  <p className="mt-2 text-sm font-medium text-black">
                    {summary.latestNoteDate}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
                <h3 className="text-sm font-semibold">Filtrer par période</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(["DAY", "WEEK", "MONTH", "YEAR"] as FilterPeriod[]).map(
                    (period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setFilterPeriod(period)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          filterPeriod === period
                            ? "bg-teal-500 text-white"
                            : "border border-black/10 bg-white text-black hover:bg-black/5"
                        }`}
                      >
                        {getPeriodLabel(period)}
                      </button>
                    ),
                  )}
                </div>

                <div className="mt-4">
                  {filterPeriod === "DAY" && (
                    <input
                      type="date"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  )}

                  {filterPeriod === "WEEK" && (
                    <input
                      type="week"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  )}

                  {filterPeriod === "MONTH" && (
                    <input
                      type="month"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  )}

                  {filterPeriod === "YEAR" && (
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                      placeholder="Choisir une année"
                    />
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  <Link
                    to="/patient/appointments"
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                  >
                    Voir mes rendez-vous
                  </Link>

                  <Link
                    to="/patient/profile"
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                  >
                    Gérer mon profil
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-semibold">Mes notes médicales</h2>
                <span className="text-sm text-black/60">
                  {filteredAppointments.length} résultat(s)
                </span>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-black/60">
                  Aucune note SOAP trouvée pour cette période.
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
                      {paginatedAppointments.map((appointment) => {
                        const isSelected =
                          selectedAppointment?.id === appointment.id;

                        return (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={() =>
                              setSelectedAppointment((current) =>
                                current?.id === appointment.id
                                  ? null
                                  : appointment,
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
                              <p className="text-sm text-black/60">
                                Dr {appointment.practitioner_first_name}{" "}
                                {appointment.practitioner_last_name}
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
                              Dr {selectedAppointment.practitioner_first_name}{" "}
                              {selectedAppointment.practitioner_last_name}
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

                  <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-black/60">
                      Page {page} sur {totalPages}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
                      >
                        Précédent
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={page === totalPages}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
