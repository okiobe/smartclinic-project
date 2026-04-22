import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAppointments,
  updateAppointmentSoapNote,
  type Appointment,
  type SoapNotePayload,
} from "../../services/appointments.api";

type FilterPeriod = "DAY" | "MONTH" | "YEAR";
type StatusFilter = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type SoapFormState = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

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

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthValue() {
  return getTodayDateValue().slice(0, 7);
}

function getCurrentYearValue() {
  return String(new Date().getFullYear());
}

function getDefaultFilterValue(period: FilterPeriod) {
  switch (period) {
    case "DAY":
      return getTodayDateValue();
    case "MONTH":
      return getCurrentMonthValue();
    case "YEAR":
      return getCurrentYearValue();
    default:
      return getCurrentMonthValue();
  }
}

function matchesSelectedPeriod(
  dateString: string,
  period: FilterPeriod,
  selectedValue: string,
) {
  if (period === "DAY") {
    return dateString === selectedValue;
  }

  if (period === "MONTH") {
    return dateString.slice(0, 7) === selectedValue;
  }

  return dateString.slice(0, 4) === selectedValue;
}

function getInitialSoapForm(appointment: Appointment): SoapFormState {
  return {
    subjective: appointment.soap_note?.subjective ?? "",
    objective: appointment.soap_note?.objective ?? "",
    assessment: appointment.soap_note?.assessment ?? "",
    plan: appointment.soap_note?.plan ?? "",
  };
}

export default function HistoriqueRendezVous() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("MONTH");
  const [filterValue, setFilterValue] = useState<string>(
    getDefaultFilterValue("MONTH"),
  );
  const [selectedPatient, setSelectedPatient] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [soapForm, setSoapForm] = useState<SoapFormState | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [soapLoading, setSoapLoading] = useState(false);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments("/appointments/");
      setAppointments(data);

      if (selectedAppointment) {
        const refreshed =
          data.find((item) => item.id === selectedAppointment.id) ?? null;

        setSelectedAppointment(refreshed);
        setSoapForm(refreshed ? getInitialSoapForm(refreshed) : null);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l’historique.";
      setError(message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const patientOptions = useMemo(() => {
    const uniquePatients = new Map<number, { id: number; label: string }>();

    appointments.forEach((appointment) => {
      if (!uniquePatients.has(appointment.patient)) {
        uniquePatients.set(appointment.patient, {
          id: appointment.patient,
          label: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
        });
      }
    });

    return Array.from(uniquePatients.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return [...appointments]
      .filter((appointment) =>
        matchesSelectedPeriod(
          appointment.appointment_date,
          filterPeriod,
          filterValue,
        ),
      )
      .filter((appointment) =>
        selectedPatient === "ALL"
          ? true
          : String(appointment.patient) === selectedPatient,
      )
      .filter((appointment) =>
        selectedStatus === "ALL" ? true : appointment.status === selectedStatus,
      )
      .sort((a, b) => {
        const left = `${b.appointment_date}T${b.start_time}`;
        const right = `${a.appointment_date}T${a.start_time}`;
        return left.localeCompare(right);
      });
  }, [
    appointments,
    filterPeriod,
    filterValue,
    selectedPatient,
    selectedStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE),
  );

  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, page]);

  useEffect(() => {
    setFilterValue(getDefaultFilterValue(filterPeriod));
    setPage(1);
    setSelectedAppointment(null);
    setSoapForm(null);
  }, [filterPeriod]);

  useEffect(() => {
    setPage(1);
    setSelectedAppointment(null);
    setSoapForm(null);
  }, [filterValue, selectedPatient, selectedStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function handleSelectAppointment(appointment: Appointment) {
    const isSameAppointment = selectedAppointment?.id === appointment.id;

    if (isSameAppointment) {
      setSelectedAppointment(null);
      setSoapForm(null);
      return;
    }

    setSelectedAppointment(appointment);
    setSoapForm(getInitialSoapForm(appointment));
    setMessage("");
    setError("");
  }

  function handleSoapChange(field: keyof SoapFormState, value: string) {
    setSoapForm((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev,
    );
    setMessage("");
    setError("");
  }

  async function handleUpdateSoap() {
    if (!selectedAppointment || !selectedAppointment.soap_note || !soapForm) {
      setError(
        "Aucune note SOAP existante n’est disponible pour ce rendez-vous.",
      );
      return;
    }

    const payload: Partial<SoapNotePayload> = {
      subjective: soapForm.subjective.trim(),
      objective: soapForm.objective.trim(),
      assessment: soapForm.assessment.trim(),
      plan: soapForm.plan.trim(),
    };

    try {
      setSoapLoading(true);
      setError("");
      setMessage("");

      await updateAppointmentSoapNote(selectedAppointment.id, payload);
      await loadAppointments();
      setMessage("La note SOAP a été mise à jour avec succès.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour la note SOAP.";
      setError(message);
    } finally {
      setSoapLoading(false);
    }
  }

  function canCreateSoap(appointment: Appointment) {
    return appointment.status === "COMPLETED" && !appointment.soap_note;
  }

  function handleCreateSoapFromHistory(appointmentId: number) {
    navigate(
      `/practitioner/medical-record?appointmentId=${appointmentId}&from=history`,
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Historique des rendez-vous
            </h1>
            <p className="mt-2 text-black/60">
              Consultez l’ensemble de vos rendez-vous passés et modifiez une
              note SOAP au besoin.
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

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4">
            <div className="flex flex-wrap gap-2">
              {(["DAY", "MONTH", "YEAR"] as FilterPeriod[]).map((period) => (
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
                  {period === "DAY"
                    ? "Jour"
                    : period === "MONTH"
                      ? "Mois"
                      : "Année"}
                </button>
              ))}
            </div>

            <div>
              {filterPeriod === "DAY" && (
                <input
                  type="date"
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

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <option value="ALL">Tous les patients</option>
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={String(patient.id)}>
                    {patient.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as StatusFilter)
                }
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="CANCELLED">Annulé</option>
                <option value="COMPLETED">Terminé</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-black/60">
            <span>{filteredAppointments.length} rendez-vous trouvé(s)</span>
            <span>
              Page {page} sur {totalPages}
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-black/60">
              Chargement de l’historique...
            </p>
          ) : filteredAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">
              Aucun rendez-vous trouvé pour ces filtres.
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {paginatedAppointments.map((appointment) => {
                  const isSelected = selectedAppointment?.id === appointment.id;

                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => handleSelectAppointment(appointment)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-teal-400 bg-teal-50"
                          : "border-black/10 bg-white hover:bg-black/5"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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

                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs ${getStatusBadgeClass(
                              appointment.status,
                            )}`}
                          >
                            {formatStatus(appointment.status)}
                          </span>

                          {canCreateSoap(appointment) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateSoapFromHistory(appointment.id);
                              }}
                              className="rounded-full bg-teal-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-600"
                            >
                              Rédiger la note SOAP
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
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

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          {!selectedAppointment ? (
            <div>
              <h2 className="text-lg font-semibold">Détails du rendez-vous</h2>
              <p className="mt-2 text-sm text-black/60">
                Sélectionnez un rendez-vous dans l’historique pour consulter ses
                détails et modifier sa note SOAP si elle existe.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Détails du rendez-vous
                </h2>
                <p className="mt-2 text-sm text-black/60">
                  Consultez les informations du rendez-vous et mettez à jour la
                  note SOAP au besoin.
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-4">
                <div className="space-y-2 text-sm text-black/80">
                  <p>
                    <span className="font-medium">Patient :</span>{" "}
                    {selectedAppointment.patient_first_name}{" "}
                    {selectedAppointment.patient_last_name}
                  </p>
                  <p>
                    <span className="font-medium">Date :</span>{" "}
                    {formatDate(selectedAppointment.appointment_date)}
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
                    <span className="font-medium">Statut :</span>{" "}
                    {formatStatus(selectedAppointment.status)}
                  </p>
                  <p>
                    <span className="font-medium">Motif :</span>{" "}
                    {selectedAppointment.reason?.trim() || "Non renseigné"}
                  </p>
                </div>
              </div>

              {!selectedAppointment.soap_note || !soapForm ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-black/60">
                  Aucune note SOAP existante n’est disponible pour ce
                  rendez-vous.
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black">
                      Subjectif
                    </label>
                    <textarea
                      value={soapForm.subjective}
                      onChange={(e) =>
                        handleSoapChange("subjective", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-black">
                      Objectif
                    </label>
                    <textarea
                      value={soapForm.objective}
                      onChange={(e) =>
                        handleSoapChange("objective", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-black">
                      Évaluation
                    </label>
                    <textarea
                      value={soapForm.assessment}
                      onChange={(e) =>
                        handleSoapChange("assessment", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-black">
                      Plan
                    </label>
                    <textarea
                      value={soapForm.plan}
                      onChange={(e) => handleSoapChange("plan", e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUpdateSoap}
                      disabled={soapLoading}
                      className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {soapLoading
                        ? "Enregistrement..."
                        : "Mettre à jour la note SOAP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAppointment(null);
                        setSoapForm(null);
                      }}
                      className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
