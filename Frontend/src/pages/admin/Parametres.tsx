import { useEffect, useState } from "react";

type AppointmentSettings = {
  defaultDurationMinutes: number;
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
  minBookingDelayHours: number;
  allowPatientCancellation: boolean;
  cancellationDeadlineHours: number;
};

type AuditSettings = {
  auditEnabled: boolean;
  retentionDays: number;
  auditLevel: "BASIC" | "STANDARD" | "FULL";
  allowCsvExport: boolean;
};

type AdminSettingsState = {
  appointments: AppointmentSettings;
  audit: AuditSettings;
};

const STORAGE_KEY = "smartclinic_admin_settings";

const defaultSettings: AdminSettingsState = {
  appointments: {
    defaultDurationMinutes: 30,
    openingTime: "08:00",
    closingTime: "18:00",
    slotIntervalMinutes: 30,
    minBookingDelayHours: 2,
    allowPatientCancellation: true,
    cancellationDeadlineHours: 24,
  },
  audit: {
    auditEnabled: true,
    retentionDays: 90,
    auditLevel: "STANDARD",
    allowCsvExport: true,
  },
};

function isValidTimeRange(openingTime: string, closingTime: string) {
  return openingTime < closingTime;
}

export default function Parametres() {
  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as AdminSettingsState;
        setSettings(parsed);
      }
    } catch {
      setError("Impossible de charger les paramètres enregistrés.");
    } finally {
      setLoading(false);
    }
  }, []);

  function updateAppointmentField<K extends keyof AppointmentSettings>(
    field: K,
    value: AppointmentSettings[K],
  ) {
    setSettings((prev) => ({
      ...prev,
      appointments: {
        ...prev.appointments,
        [field]: value,
      },
    }));

    setMessage("");
    setError("");
  }

  function updateAuditField<K extends keyof AuditSettings>(
    field: K,
    value: AuditSettings[K],
  ) {
    setSettings((prev) => ({
      ...prev,
      audit: {
        ...prev.audit,
        [field]: value,
      },
    }));

    setMessage("");
    setError("");
  }

  function handleSave() {
    setMessage("");
    setError("");

    if (
      !isValidTimeRange(
        settings.appointments.openingTime,
        settings.appointments.closingTime,
      )
    ) {
      setError(
        "L’heure d’ouverture doit être antérieure à l’heure de fermeture.",
      );
      return;
    }

    if (settings.appointments.defaultDurationMinutes <= 0) {
      setError("La durée par défaut doit être supérieure à 0.");
      return;
    }

    if (settings.appointments.slotIntervalMinutes <= 0) {
      setError("L’intervalle des créneaux doit être supérieur à 0.");
      return;
    }

    if (settings.appointments.minBookingDelayHours < 0) {
      setError("Le délai minimum avant réservation ne peut pas être négatif.");
      return;
    }

    if (settings.appointments.cancellationDeadlineHours < 0) {
      setError("Le délai limite d’annulation ne peut pas être négatif.");
      return;
    }

    if (settings.audit.retentionDays <= 0) {
      setError("La durée de conservation des logs doit être supérieure à 0.");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setMessage(
        "Les paramètres administrateur ont été enregistrés avec succès.",
      );
    } catch {
      setError("Impossible d’enregistrer les paramètres.");
    }
  }

  function handleReset() {
    setSettings(defaultSettings);
    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <p className="text-sm text-black/60">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#0f172a]">
          Paramètres — Administrateur
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Configurez les règles générales liées aux rendez-vous et à l’audit
          dans SmartClinic.
        </p>
      </section>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Paramètres des rendez-vous
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Définissez les règles de fonctionnement par défaut pour la
            réservation et l’annulation des rendez-vous.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Durée par défaut d’un rendez-vous (minutes)
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={settings.appointments.defaultDurationMinutes}
              onChange={(e) =>
                updateAppointmentField(
                  "defaultDurationMinutes",
                  Number(e.target.value) || 0,
                )
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Intervalle des créneaux (minutes)
            </label>
            <select
              value={settings.appointments.slotIntervalMinutes}
              onChange={(e) =>
                updateAppointmentField(
                  "slotIntervalMinutes",
                  Number(e.target.value),
                )
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Heure d’ouverture
            </label>
            <input
              type="time"
              value={settings.appointments.openingTime}
              onChange={(e) =>
                updateAppointmentField("openingTime", e.target.value)
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Heure de fermeture
            </label>
            <input
              type="time"
              value={settings.appointments.closingTime}
              onChange={(e) =>
                updateAppointmentField("closingTime", e.target.value)
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Délai minimum avant réservation (heures)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.appointments.minBookingDelayHours}
              onChange={(e) =>
                updateAppointmentField(
                  "minBookingDelayHours",
                  Number(e.target.value) || 0,
                )
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Délai limite d’annulation patient (heures)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.appointments.cancellationDeadlineHours}
              onChange={(e) =>
                updateAppointmentField(
                  "cancellationDeadlineHours",
                  Number(e.target.value) || 0,
                )
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
              disabled={!settings.appointments.allowPatientCancellation}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-black/10 bg-[#fcfcfb] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">
                Autoriser l’annulation par le patient
              </p>
              <p className="mt-1 text-sm text-black/60">
                Permet au patient d’annuler lui-même un rendez-vous dans le
                délai défini ci-dessus.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.appointments.allowPatientCancellation}
                onChange={(e) =>
                  updateAppointmentField(
                    "allowPatientCancellation",
                    e.target.checked,
                  )
                }
                className="h-5 w-5 rounded border-black/20 text-teal-600 focus:ring-teal-500"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Paramètres d’audit
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Configurez le comportement global du journal d’audit de SmartClinic.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Durée de conservation des logs (jours)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={settings.audit.retentionDays}
              onChange={(e) =>
                updateAuditField("retentionDays", Number(e.target.value) || 0)
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
              disabled={!settings.audit.auditEnabled}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0f172a]">
              Niveau d’audit
            </label>
            <select
              value={settings.audit.auditLevel}
              onChange={(e) =>
                updateAuditField(
                  "auditLevel",
                  e.target.value as AuditSettings["auditLevel"],
                )
              }
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
              disabled={!settings.audit.auditEnabled}
            >
              <option value="BASIC">Basic</option>
              <option value="STANDARD">Standard</option>
              <option value="FULL">Full</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#0f172a]">
                  Activer le journal d’audit
                </p>
                <p className="mt-1 text-sm text-black/60">
                  Active ou désactive globalement l’enregistrement des
                  événements système.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.audit.auditEnabled}
                  onChange={(e) =>
                    updateAuditField("auditEnabled", e.target.checked)
                  }
                  className="h-5 w-5 rounded border-black/20 text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#0f172a]">
                  Autoriser l’export CSV
                </p>
                <p className="mt-1 text-sm text-black/60">
                  Permet aux administrateurs d’exporter les journaux d’audit au
                  format CSV.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.audit.allowCsvExport}
                  onChange={(e) =>
                    updateAuditField("allowCsvExport", e.target.checked)
                  }
                  className="h-5 w-5 rounded border-black/20 text-teal-600 focus:ring-teal-500"
                  disabled={!settings.audit.auditEnabled}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Enregistrer
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#0f172a] hover:bg-black/5"
        >
          Réinitialiser
        </button>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0f172a]">
          Résumé de configuration
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Durée par défaut</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.defaultDurationMinutes} min
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Plage horaire</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.openingTime} -{" "}
              {settings.appointments.closingTime}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Intervalle créneaux</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.slotIntervalMinutes} min
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Délai minimum réservation</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.minBookingDelayHours} h
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Annulation patient</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.allowPatientCancellation
                ? "Activée"
                : "Désactivée"}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Limite d’annulation</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.appointments.allowPatientCancellation
                ? `${settings.appointments.cancellationDeadlineHours} h`
                : "Non applicable"}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Audit activé</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.audit.auditEnabled ? "Oui" : "Non"}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Conservation des logs</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.audit.retentionDays} jours
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Niveau d’audit</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.audit.auditLevel}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/60">Export CSV audit</p>
            <p className="mt-2 text-xl font-semibold text-[#0f172a]">
              {settings.audit.allowCsvExport ? "Autorisé" : "Bloqué"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
