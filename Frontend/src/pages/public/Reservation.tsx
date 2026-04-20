import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, type Service } from "../../services/services.api";
import {
  getPractitioners,
  getPractitionerAvailability,
  type Practitioner,
  type AvailabilityRule,
} from "../../services/practitioners.api";
import {
  createAppointment,
  getAppointments,
} from "../../services/appointments.api";
import { getMyPatientProfile } from "../../services/patients.api";

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

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTimeInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function Reservation() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<
    { start_time: string; end_time: string }[]
  >([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedPractitioner, setSelectedPractitioner] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const chosenService = useMemo(
    () => services.find((s) => String(s.id) === selectedService),
    [services, selectedService],
  );

  async function loadServices() {
    const data = await getServices();
    setServices(data);
  }

  async function loadPractitioners(serviceId?: string) {
    let endpoint = "/practitioners/";
    if (serviceId) {
      endpoint += `?service=${serviceId}`;
    }
    const data = await getPractitioners(endpoint);
    setPractitioners(data);
  }

  async function loadAvailability(practitionerId: number) {
    try {
      setLoadingAvailability(true);
      const data = await getPractitionerAvailability(practitionerId);
      setAvailability(data);
    } catch {
      setError("Erreur lors du chargement des disponibilités.");
    } finally {
      setLoadingAvailability(false);
    }
  }

  async function loadAppointmentsForDay(practitionerId: number, date: string) {
    try {
      const data = await getAppointments(
        `/appointments/?practitioner=${practitionerId}&date=${date}`,
      );
      setExistingAppointments(
        data.map((item) => ({
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      );
    } catch {
      setError("Erreur lors du chargement des rendez-vous existants.");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        await loadServices();
        await loadPractitioners();
      } catch {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  function handleServiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedService(value);
    setSelectedPractitioner("");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailability([]);
    setExistingAppointments([]);
    setMessage("");
    setError("");

    loadPractitioners(value).catch(() => {
      setError("Erreur lors du chargement des praticiens.");
    });
  }

  function handlePractitionerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedPractitioner(value);
    setSelectedDate("");
    setSelectedSlot("");
    setAvailability([]);
    setExistingAppointments([]);
    setMessage("");
    setError("");

    if (value) {
      loadAvailability(Number(value));
    }
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSelectedDate(value);
    setSelectedSlot("");
    setExistingAppointments([]);
    setMessage("");
    setError("");

    if (value && selectedPractitioner) {
      await loadAppointmentsForDay(Number(selectedPractitioner), value);
    }
  }

  const availableSlots = useMemo(() => {
    if (!selectedDate || !chosenService) return [];

    const weekday = getIsoWeekday(selectedDate);
    const dayRules = availability.filter(
      (rule) => rule.is_active && rule.weekday === weekday,
    );

    const duration = chosenService.duration_minutes;
    const slots: string[] = [];
    const todayDate = getTodayDateValue();
    const isToday = selectedDate === todayDate;
    const currentMinutes = getCurrentTimeInMinutes();

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

        const isOverlapping = existingAppointments.some((appt) => {
          return (
            timeToMinutes(appt.start_time) < timeToMinutes(slotEnd) &&
            timeToMinutes(appt.end_time) > timeToMinutes(slotStart)
          );
        });

        const isPastSlotToday = isToday && current < currentMinutes;

        if (!isOverlapping && !isPastSlotToday) {
          slots.push(slotStart);
        }
      }
    });

    return slots;
  }, [availability, chosenService, selectedDate, existingAppointments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !selectedService ||
      !selectedPractitioner ||
      !selectedDate ||
      !selectedSlot ||
      !chosenService
    ) {
      setError("Veuillez compléter tous les champs requis.");
      return;
    }

    if (
      selectedDate === getTodayDateValue() &&
      timeToMinutes(selectedSlot) < getCurrentTimeInMinutes()
    ) {
      setError(
        "Impossible de réserver un rendez-vous pour une heure déjà passée aujourd’hui.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      const patient = await getMyPatientProfile();

      const startMinutes = timeToMinutes(selectedSlot);
      const endMinutes = startMinutes + chosenService.duration_minutes;
      const endTime = minutesToTime(endMinutes);

      await createAppointment({
        patient: patient.id,
        practitioner: Number(selectedPractitioner),
        service: Number(selectedService),
        appointment_date: selectedDate,
        start_time: selectedSlot,
        end_time: endTime,
        reason: reason.trim(),
      });

      setMessage("Rendez-vous créé avec succès.");
      setSelectedService("");
      setSelectedPractitioner("");
      setSelectedDate("");
      setSelectedSlot("");
      setReason("");
      setAvailability([]);
      setExistingAppointments([]);
      await loadPractitioners();

      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 1200);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du rendez-vous.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-xl font-semibold">Réserver un rendez-vous</h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-black/60">Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <select
              value={selectedService}
              onChange={handleServiceChange}
              className="mb-4 w-full rounded-xl border p-3"
            >
              <option value="">Choisir un service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPractitioner}
              onChange={handlePractitionerChange}
              className="mb-4 w-full rounded-xl border p-3"
              disabled={!selectedService}
            >
              <option value="">Choisir un praticien</option>
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} — {p.specialty}
                </option>
              ))}
            </select>

            <input
              type="date"
              min={getTodayDateValue()}
              value={selectedDate}
              onChange={handleDateChange}
              className="mb-4 w-full rounded-xl border p-3"
              disabled={!selectedPractitioner}
            />

            {loadingAvailability ? (
              <p className="mb-4 text-sm text-black/60">
                Chargement des disponibilités...
              </p>
            ) : selectedDate && selectedPractitioner ? (
              availableSlots.length > 0 ? (
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="mb-4 w-full rounded-xl border p-3"
                >
                  <option value="">Choisir un créneau</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot.slice(0, 5)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mb-4 text-sm text-black/60">
                  Aucun créneau disponible pour cette date.
                </p>
              )
            ) : null}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif du rendez-vous (optionnel)"
              rows={3}
              className="mb-6 w-full rounded-xl border p-3"
            />

            <button
              type="submit"
              disabled={
                !selectedService ||
                !selectedPractitioner ||
                !selectedDate ||
                !selectedSlot ||
                isSubmitting
              }
              className="w-full rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-70"
            >
              {isSubmitting ? "Réservation..." : "Confirmer le rendez-vous"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
