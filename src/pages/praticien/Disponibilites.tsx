import { useEffect, useMemo, useState } from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WeeklyAvailability = Record<
  DayKey,
  {
    enabled: boolean;
    start: string; // "08:30"
    end: string; // "16:30"
  }
>;

type ExceptionItem = {
  id: string;
  startDate: string; // "2026-03-10"
  endDate: string; // "2026-03-12"
  reason: string;
};

type Settings = {
  appointmentDurationMin: number; // ex 30
  bufferMin: number; // ex 10
  weekly: WeeklyAvailability;
  exceptions: ExceptionItem[];
};

const STORAGE_KEY = "smartclinic_practitioner_availability_v1";

const dayLabels: Record<DayKey, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

function defaultSettings(): Settings {
  return {
    appointmentDurationMin: 30,
    bufferMin: 10,
    weekly: {
      mon: { enabled: true, start: "09:00", end: "17:00" },
      tue: { enabled: true, start: "09:00", end: "17:00" },
      wed: { enabled: true, start: "09:00", end: "17:00" },
      thu: { enabled: true, start: "09:00", end: "17:00" },
      fri: { enabled: true, start: "09:00", end: "15:00" },
      sat: { enabled: false, start: "09:00", end: "12:00" },
      sun: { enabled: false, start: "09:00", end: "12:00" },
    },
    exceptions: [
      {
        id: "EX-1",
        startDate: "2026-03-20",
        endDate: "2026-03-20",
        reason: "Congé (démo)",
      },
    ],
  };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return JSON.parse(raw) as Settings;
  } catch {
    return defaultSettings();
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function slotCount(
  start: string,
  end: string,
  duration: number,
  buffer: number,
): number {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (e <= s) return 0;
  const step = duration + buffer;
  if (step <= 0) return 0;
  return Math.floor((e - s) / step);
}

function isValidTimeRange(start: string, end: string): boolean {
  return timeToMinutes(end) > timeToMinutes(start);
}

export default function Disponibilites() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form exception
  const [exStart, setExStart] = useState("");
  const [exEnd, setExEnd] = useState("");
  const [exReason, setExReason] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const weeklyPreview = useMemo(() => {
    const rows: Array<{ day: DayKey; label: string; text: string }> = [];
    (Object.keys(dayLabels) as DayKey[]).forEach((day) => {
      const d = settings.weekly[day];
      if (!d.enabled) {
        rows.push({ day, label: dayLabels[day], text: "Fermé" });
        return;
      }
      const count = slotCount(
        d.start,
        d.end,
        settings.appointmentDurationMin,
        settings.bufferMin,
      );
      rows.push({
        day,
        label: dayLabels[day],
        text: `${d.start} → ${d.end} · ${count} créneaux`,
      });
    });
    return rows;
  }, [settings]);

  function setDayEnabled(day: DayKey, enabled: boolean) {
    setSettings((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: { ...prev.weekly[day], enabled },
      },
    }));
  }

  function setDayTime(day: DayKey, field: "start" | "end", value: string) {
    setSettings((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: { ...prev.weekly[day], [field]: value },
      },
    }));
  }

  function setDuration(value: number) {
    setSettings((prev) => ({ ...prev, appointmentDurationMin: value }));
  }

  function setBuffer(value: number) {
    setSettings((prev) => ({ ...prev, bufferMin: value }));
  }

  function addException() {
    setStatusMsg(null);

    if (!exStart || !exEnd) {
      setStatusMsg("Veuillez sélectionner une date de début et de fin.");
      return;
    }
    if (exEnd < exStart) {
      setStatusMsg("La date de fin ne peut pas être avant la date de début.");
      return;
    }
    const reason = exReason.trim() || "Indisponibilité";

    const id = `EX-${Date.now()}`;
    const item: ExceptionItem = {
      id,
      startDate: exStart,
      endDate: exEnd,
      reason,
    };

    setSettings((prev) => ({
      ...prev,
      exceptions: [item, ...prev.exceptions],
    }));
    setExStart("");
    setExEnd("");
    setExReason("");
  }

  function removeException(id: string) {
    setSettings((prev) => ({
      ...prev,
      exceptions: prev.exceptions.filter((x) => x.id !== id),
    }));
  }

  function validateBeforeSave(): string | null {
    if (settings.appointmentDurationMin < 5)
      return "La durée du rendez-vous doit être ≥ 5 minutes.";
    if (settings.bufferMin < 0)
      return "Le temps tampon ne peut pas être négatif.";

    for (const day of Object.keys(dayLabels) as DayKey[]) {
      const d = settings.weekly[day];
      if (!d.enabled) continue;
      if (!isValidTimeRange(d.start, d.end)) {
        return `Plage horaire invalide pour ${dayLabels[day]} (fin doit être après début).`;
      }
    }
    return null;
  }

  function save() {
    const err = validateBeforeSave();
    if (err) {
      setStatusMsg(err);
      return;
    }
    saveSettings(settings);
    setStatusMsg("Disponibilités sauvegardées ✅");
    window.setTimeout(() => setStatusMsg(null), 2500);
  }

  function reset() {
    const d = defaultSettings();
    setSettings(d);
    saveSettings(d);
    setStatusMsg("Réinitialisé.");
    window.setTimeout(() => setStatusMsg(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Disponibilités</h1>
            <p className="mt-2 text-black/60 text-sm">
              Configurez vos horaires hebdomadaires, la durée des rendez-vous et
              vos exceptions (congés/indisponibilités).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={reset}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
            >
              Réinitialiser
            </button>
            <button
              onClick={save}
              className="rounded-full bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Settings: Duration & Buffer */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Paramètres de rendez-vous"
          subtitle="Durée et temps tampon entre les rendez-vous."
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durée (minutes)">
              <input
                type="number"
                min={5}
                value={settings.appointmentDurationMin}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </Field>

            <Field label="Temps tampon (minutes)">
              <input
                type="number"
                min={0}
                value={settings.bufferMin}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </Field>
          </div>

          <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4 text-sm text-black/70">
            Exemple : durée {settings.appointmentDurationMin} min + tampon{" "}
            {settings.bufferMin} min → créneaux toutes les{" "}
            {settings.appointmentDurationMin + settings.bufferMin} minutes.
          </div>
        </Card>

        <Card
          title="Aperçu hebdomadaire"
          subtitle="Résumé du nombre de créneaux estimé par jour."
        >
          <div className="space-y-2">
            {weeklyPreview.map((r) => (
              <div
                key={r.day}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white/60 px-4 py-2"
              >
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-sm text-black/60">{r.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly schedule table */}
      <Card
        title="Horaires hebdomadaires"
        subtitle="Activez/désactivez chaque jour et définissez les heures."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-black/60">
              <tr className="border-b border-black/10">
                <th className="py-3 pr-4">Jour</th>
                <th className="py-3 pr-4">Actif</th>
                <th className="py-3 pr-4">Début</th>
                <th className="py-3 pr-4">Fin</th>
                <th className="py-3 pr-2">Validation</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(dayLabels) as DayKey[]).map((day) => {
                const d = settings.weekly[day];
                const ok = !d.enabled || isValidTimeRange(d.start, d.end);
                return (
                  <tr key={day} className="border-b border-black/5">
                    <td className="py-3 pr-4 font-medium">{dayLabels[day]}</td>

                    <td className="py-3 pr-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={(e) => setDayEnabled(day, e.target.checked)}
                        />
                        <span className="text-black/60">
                          {d.enabled ? "Ouvert" : "Fermé"}
                        </span>
                      </label>
                    </td>

                    <td className="py-3 pr-4">
                      <input
                        type="time"
                        value={d.start}
                        disabled={!d.enabled}
                        onChange={(e) =>
                          setDayTime(day, "start", e.target.value)
                        }
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:border-teal-500"
                      />
                    </td>

                    <td className="py-3 pr-4">
                      <input
                        type="time"
                        value={d.end}
                        disabled={!d.enabled}
                        onChange={(e) => setDayTime(day, "end", e.target.value)}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:border-teal-500"
                      />
                    </td>

                    <td className="py-3 pr-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                          ok
                            ? "border-black/10 bg-white text-black/70"
                            : "border-red-500/30 bg-red-500/10 text-red-700"
                        }`}
                      >
                        {ok ? "OK" : "Invalide"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Exceptions */}
      <Card
        title="Exceptions"
        subtitle="Ajoutez des congés/indisponibilités (dates)."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Début">
            <input
              type="date"
              value={exStart}
              onChange={(e) => setExStart(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </Field>

          <Field label="Fin">
            <input
              type="date"
              value={exEnd}
              onChange={(e) => setExEnd(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </Field>

          <Field label="Raison">
            <input
              type="text"
              value={exReason}
              onChange={(e) => setExReason(e.target.value)}
              placeholder="Congé, formation, etc."
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </Field>

          <div className="flex items-end">
            <button
              onClick={addException}
              className="w-full rounded-full bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {settings.exceptions.length === 0 && (
            <p className="text-sm text-black/60">Aucune exception.</p>
          )}

          {settings.exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {ex.startDate} → {ex.endDate}
                </p>
                <p className="text-sm text-black/60">{ex.reason}</p>
              </div>

              <button
                onClick={() => removeException(ex.id)}
                className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm hover:bg-black/5"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-black/60">{subtitle}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-black/60">{label}</label>
      {children}
    </div>
  );
}
