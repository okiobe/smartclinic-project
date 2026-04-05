import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  getAppointmentDetail,
  cancelAppointment,
  createAppointment,
  type Appointment,
} from "../../services/appointments.api";
import {
  getPractitionerAvailability,
  type AvailabilityRule,
} from "../../services/practitioners.api";

type RescheduleForm = {
  appointment_date: string;
  start_time: string;
};

const initialRescheduleForm: RescheduleForm = {
  appointment_date: "",
  start_time: "",
};

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

function timeToMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function getIsoWeekday(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function getDurationInMinutes(startTime: string, endTime: string) {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isPastAppointmentDate(dateString: string) {
  return dateString < getTodayDateInputValue();
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

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  );
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm>(
    initialRescheduleForm,
  );
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [practitionerAvailabilities, setPractitionerAvailabilities] = useState<
    AvailabilityRule[]
  >([]);
  const [existingAppointments, setExistingAppointments] = useState<
    { id: number; start_time: string; end_time: string; status: string }[]
  >([]);

  const appointmentDuration = useMemo(() => {
    if (!rescheduleTarget) return 0;

    return getDurationInMinutes(
      rescheduleTarget.start_time,
      rescheduleTarget.end_time,
    );
  }, [rescheduleTarget]);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments("/appointments/");
      setAppointments(data);

      if (selectedAppointment) {
        const refreshed =
          data.find((item) => item.id === selectedAppointment.id) ?? null;

        if (refreshed) {
          const detail = await getAppointmentDetail(refreshed.id);
          setSelectedAppointment(detail);
        } else {
          setSelectedAppointment(null);
        }
      }
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
      setInfoMessage("Le rendez-vous a été annulé avec succès.");
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

  async function loadAppointmentsForDay(practitionerId: number, date: string) {
    try {
      setAppointmentsLoading(true);

      const data = await getAppointments(
        `/appointments/?practitioner=${practitionerId}&date=${date}`,
      );

      setExistingAppointments(
        data.map((item) => ({
          id: item.id,
          start_time: item.start_time,
          end_time: item.end_time,
          status: item.status,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous existants.";
      setError(message);
      setExistingAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }

  async function handleOpenReschedule(appointment: Appointment) {
    try {
      setAvailabilityLoading(true);
      setError("");
      setInfoMessage("");

      const availabilities = await getPractitionerAvailability(
        appointment.practitioner,
      );

      setPractitionerAvailabilities(availabilities);
      setRescheduleTarget(appointment);
      setRescheduleForm({
        appointment_date: appointment.appointment_date,
        start_time: "",
      });

      await loadAppointmentsForDay(
        appointment.practitioner,
        appointment.appointment_date,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger les informations de reprogrammation.";
      setError(message);
      setRescheduleTarget(null);
      setPractitionerAvailabilities([]);
      setExistingAppointments([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function handleCloseReschedule() {
    setRescheduleTarget(null);
    setRescheduleForm(initialRescheduleForm);
    setPractitionerAvailabilities([]);
    setExistingAppointments([]);
  }

  async function handleRescheduleDateChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const value = e.target.value;

    setRescheduleForm({
      appointment_date: value,
      start_time: "",
    });
    setExistingAppointments([]);
    setError("");
    setInfoMessage("");

    if (rescheduleTarget && value) {
      await loadAppointmentsForDay(rescheduleTarget.practitioner, value);
    }
  }

  function handleRescheduleSlotChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target;

    setRescheduleForm((prev) => ({
      ...prev,
      start_time: value,
    }));
  }

  const availableSlots = useMemo(() => {
    if (!rescheduleTarget || !rescheduleForm.appointment_date) return [];

    const weekday = getIsoWeekday(rescheduleForm.appointment_date);
    const dayRules = practitionerAvailabilities.filter(
      (rule) => rule.is_active && rule.weekday === weekday,
    );

    const duration = appointmentDuration;
    const slots: string[] = [];

    dayRules.forEach((rule) => {
      const start = timeToMinutes(rule.start_time);
      const end = timeToMinutes(rule.end_time);

      for (
        let current = start;
        current + duration <= end;
        current += duration
      ) {
        const slotStart = minutesToTime(current);
        const slotEnd = minutesToTime(current + duration);

        const isOverlapping = existingAppointments
          .filter(
            (appt) =>
              appt.id !== rescheduleTarget.id && appt.status !== "CANCELLED",
          )
          .some((appt) => {
            return (
              timeToMinutes(appt.start_time) < timeToMinutes(slotEnd) &&
              timeToMinutes(appt.end_time) > timeToMinutes(slotStart)
            );
          });

        if (!isOverlapping) {
          slots.push(slotStart);
        }
      }
    });

    return slots;
  }, [
    practitionerAvailabilities,
    appointmentDuration,
    rescheduleForm.appointment_date,
    existingAppointments,
    rescheduleTarget,
  ]);

  const calculatedEndTime = useMemo(() => {
    if (!rescheduleForm.start_time || !appointmentDuration) return "";
    return minutesToTime(
      timeToMinutes(rescheduleForm.start_time) + appointmentDuration,
    );
  }, [rescheduleForm.start_time, appointmentDuration]);

  async function handleSubmitReschedule(e: React.FormEvent) {
    e.preventDefault();

    if (!rescheduleTarget) return;

    if (!rescheduleForm.appointment_date) {
      setError("Veuillez sélectionner une nouvelle date.");
      return;
    }

    if (!rescheduleForm.start_time) {
      setError("Veuillez sélectionner un créneau horaire.");
      return;
    }

    try {
      setRescheduleLoading(true);
      setError("");
      setInfoMessage("");

      await createAppointment({
        patient: rescheduleTarget.patient,
        practitioner: rescheduleTarget.practitioner,
        service: rescheduleTarget.service,
        appointment_date: rescheduleForm.appointment_date,
        start_time: rescheduleForm.start_time,
        end_time: calculatedEndTime,
        reason: rescheduleTarget.reason,
      });

      await cancelAppointment(rescheduleTarget.id);

      if (selectedAppointment?.id === rescheduleTarget.id) {
        const refreshedOriginal = await getAppointmentDetail(
          rescheduleTarget.id,
        );
        setSelectedAppointment(refreshedOriginal);
      }

      await loadAppointments();
      handleCloseReschedule();
      setInfoMessage(
        "Le rendez-vous a été reprogrammé avec succès. L’ancien rendez-vous a été annulé automatiquement.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de reprogrammer ce rendez-vous.";
      setError(message);
    } finally {
      setRescheduleLoading(false);
    }
  }

  function canCancel(status: string) {
    return status === "PENDING" || status === "CONFIRMED";
  }

  function canReschedule(appointment: Appointment) {
    return (
      (appointment.status === "PENDING" ||
        appointment.status === "CONFIRMED") &&
      !isPastAppointmentDate(appointment.appointment_date)
    );
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

      {rescheduleTarget && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Reprogrammer le rendez-vous
              </h2>
              <p className="mt-1 text-sm text-black/60">
                Sélectionnez une nouvelle date puis un créneau disponible,
                exactement comme lors de la prise de rendez-vous.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseReschedule}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
            >
              Fermer
            </button>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
              <h3 className="mb-3 text-sm font-semibold text-black/70">
                Informations conservées
              </h3>
              <div className="space-y-2 text-sm text-black/80">
                <p>
                  <span className="font-medium">Service :</span>{" "}
                  {rescheduleTarget.service_name}
                </p>
                <p>
                  <span className="font-medium">Praticien :</span> Dr{" "}
                  {rescheduleTarget.practitioner_first_name}{" "}
                  {rescheduleTarget.practitioner_last_name}
                </p>
                <p>
                  <span className="font-medium">Durée :</span>{" "}
                  {appointmentDuration} minutes
                </p>
                <p>
                  <span className="font-medium">Motif :</span>{" "}
                  {rescheduleTarget.reason?.trim() || "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
              <h3 className="mb-3 text-sm font-semibold text-black/70">
                Rendez-vous d’origine
              </h3>
              <div className="space-y-2 text-sm text-black/80">
                <p>
                  <span className="font-medium">Date :</span>{" "}
                  {rescheduleTarget.appointment_date}
                </p>
                <p>
                  <span className="font-medium">Heure :</span>{" "}
                  {formatTime(rescheduleTarget.start_time)} -{" "}
                  {formatTime(rescheduleTarget.end_time)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitReschedule} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nouvelle date
                </label>
                <input
                  type="date"
                  value={rescheduleForm.appointment_date}
                  onChange={handleRescheduleDateChange}
                  min={getTodayDateInputValue()}
                  className="border w-full p-3 rounded-xl"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Créneau disponible
                </label>
                {availabilityLoading || appointmentsLoading ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Chargement des créneaux...
                  </p>
                ) : rescheduleForm.appointment_date ? (
                  availableSlots.length > 0 ? (
                    <select
                      value={rescheduleForm.start_time}
                      onChange={handleRescheduleSlotChange}
                      className="border w-full p-3 rounded-xl"
                    >
                      <option value="">Choisir un créneau</option>
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot.slice(0, 5)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Aucun créneau disponible pour cette date.
                    </p>
                  )
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Choisissez d’abord une date.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Heure de fin
                </label>
                <input
                  type="text"
                  value={calculatedEndTime ? calculatedEndTime.slice(0, 5) : ""}
                  readOnly
                  className="border w-full p-3 rounded-xl bg-slate-50"
                  placeholder="Calculée automatiquement"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={rescheduleLoading || !rescheduleForm.start_time}
                className="rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-70"
              >
                {rescheduleLoading
                  ? "Reprogrammation..."
                  : "Confirmer la reprogrammation"}
              </button>

              <button
                type="button"
                onClick={handleCloseReschedule}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium hover:bg-black/5"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

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
                            onClick={() => handleOpenReschedule(a)}
                            disabled={!canReschedule(a)}
                            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
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

              {(selectedAppointment.status === "PENDING" ||
                selectedAppointment.status === "CONFIRMED") && (
                <div className="flex flex-wrap justify-end gap-3">
                  {!isPastAppointmentDate(
                    selectedAppointment.appointment_date,
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(selectedAppointment)}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
                    >
                      Reprogrammer
                    </button>
                  )}

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
