import { useEffect, useMemo, useState } from "react";
import {
  getMyPractitionerAvailabilities,
  createMyPractitionerAvailability,
  updateMyPractitionerAvailability,
  deleteMyPractitionerAvailability,
  type AvailabilityRule,
} from "../../services/practitioners.api";

type AvailabilityForm = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const initialForm: AvailabilityForm = {
  weekday: 1,
  start_time: "09:00",
  end_time: "17:00",
  is_active: true,
};

const weekdayOptions = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

function formatTime(time: string) {
  return time.slice(0, 5);
}

function availabilityToForm(item: AvailabilityRule): AvailabilityForm {
  return {
    weekday: item.weekday,
    start_time: formatTime(item.start_time),
    end_time: formatTime(item.end_time),
    is_active: item.is_active,
  };
}

export default function Disponibilites() {
  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<AvailabilityForm>(initialForm);
  const [selectedAvailability, setSelectedAvailability] =
    useState<AvailabilityRule | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadAvailabilities() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyPractitionerAvailabilities();
      setAvailabilities(data);

      if (selectedAvailability) {
        const refreshed =
          data.find((item) => item.id === selectedAvailability.id) ?? null;
        setSelectedAvailability(refreshed);
        setForm(refreshed ? availabilityToForm(refreshed) : initialForm);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des disponibilités.";
      setError(message);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const groupedAvailabilities = useMemo(() => {
    const grouped: Record<string, AvailabilityRule[]> = {};

    for (const item of availabilities) {
      const key = item.weekday_display;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    return grouped;
  }, [availabilities]);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? target.checked
          : name === "weekday"
            ? Number(value)
            : value,
    }));

    clearFeedback();
  }

  function resetForm() {
    setSelectedAvailability(null);
    setForm(initialForm);
    clearFeedback();
  }

  function handleSelectAvailability(item: AvailabilityRule) {
    setSelectedAvailability(item);
    setForm(availabilityToForm(item));
    clearFeedback();
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.start_time >= form.end_time) {
      setError("L’heure de fin doit être après l’heure de début.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      await createMyPractitionerAvailability({
        weekday: form.weekday,
        start_time: form.start_time,
        end_time: form.end_time,
        is_active: form.is_active,
      });

      setMessage("Disponibilité créée avec succès.");
      setForm(initialForm);
      await loadAvailabilities();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer la disponibilité.";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedAvailability) {
      setError("Veuillez sélectionner une disponibilité à modifier.");
      return;
    }

    if (form.start_time >= form.end_time) {
      setError("L’heure de fin doit être après l’heure de début.");
      return;
    }

    try {
      setIsUpdating(true);
      setError("");
      setMessage("");

      await updateMyPractitionerAvailability(selectedAvailability.id, {
        weekday: form.weekday,
        start_time: form.start_time,
        end_time: form.end_time,
        is_active: form.is_active,
      });

      setMessage("Disponibilité mise à jour avec succès.");
      await loadAvailabilities();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de modifier la disponibilité.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteAvailability(availabilityId: number) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette disponibilité ?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(availabilityId);
      setError("");
      setMessage("");

      await deleteMyPractitionerAvailability(availabilityId);

      if (selectedAvailability?.id === availabilityId) {
        resetForm();
      }

      setMessage("Disponibilité supprimée avec succès.");
      await loadAvailabilities();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la disponibilité.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Disponibilités</h1>
        <p className="mt-2 text-sm text-black/60">
          Gérez les disponibilités définies pour votre agenda.
        </p>
      </div>

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
          <h2 className="text-lg font-semibold">Créer une disponibilité</h2>

          <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Jour
              </label>
              <select
                name="weekday"
                value={form.weekday}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                {weekdayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Heure de début
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Heure de fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Disponibilité active
            </label>

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-70"
            >
              {isCreating ? "Création..." : "Créer la disponibilité"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <h2 className="text-lg font-semibold">
            {selectedAvailability
              ? "Modifier la disponibilité"
              : "Sélectionner une disponibilité"}
          </h2>

          {!selectedAvailability ? (
            <p className="mt-4 text-sm text-slate-600">
              Sélectionnez une disponibilité dans la liste pour la modifier.
            </p>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jour
                </label>
                <select
                  name="weekday"
                  value={form.weekday}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {weekdayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Disponibilité active
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                >
                  {isUpdating ? "Enregistrement..." : "Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        {loading ? (
          <p className="text-sm text-black/60">
            Chargement des disponibilités...
          </p>
        ) : availabilities.length === 0 ? (
          <p className="text-sm text-black/60">
            Aucune disponibilité définie pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAvailabilities).map(([day, items]) => (
              <div
                key={day}
                className="rounded-xl border border-black/10 bg-white p-4"
              >
                <h2 className="font-semibold">{day}</h2>

                <div className="mt-3 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-black/10 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {formatTime(item.start_time)} -{" "}
                          {formatTime(item.end_time)}
                        </div>

                        <div className="mt-1">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAvailability(item)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAvailability(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-70"
                        >
                          {deletingId === item.id
                            ? "Suppression..."
                            : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
