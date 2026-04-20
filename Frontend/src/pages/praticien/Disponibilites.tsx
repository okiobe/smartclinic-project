import { useEffect, useMemo, useState } from "react";
import {
  createMyPractitionerAvailability,
  deleteMyPractitionerAvailability,
  getMyPractitionerAvailabilities,
  updateMyPractitionerAvailability,
  type AvailabilityRule,
} from "../../services/practitioners.api";

type AvailabilityForm = {
  weekday: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const initialForm: AvailabilityForm = {
  weekday: "1",
  start_time: "",
  end_time: "",
  is_active: true,
};

const weekdays = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "7", label: "Dimanche" },
];

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function Disponibilites() {
  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<AvailabilityForm>(initialForm);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAvailabilities() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyPractitionerAvailabilities();
      setAvailabilities(data);
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

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const nextValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setError("");
    setMessage("");
  }

  function handleEdit(item: AvailabilityRule) {
    setEditingId(item.id);
    setForm({
      weekday: String(item.weekday),
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
      is_active: item.is_active,
    });
    setError("");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.start_time || !form.end_time) {
      setError("Veuillez renseigner les heures de début et de fin.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        weekday: Number(form.weekday),
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        is_active: form.is_active,
      };

      if (editingId) {
        await updateMyPractitionerAvailability(editingId, payload);
        setMessage("Disponibilité mise à jour avec succès.");
      } else {
        await createMyPractitionerAvailability(payload);
        setMessage("Disponibilité ajoutée avec succès.");
      }

      resetForm();
      await loadAvailabilities();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de l’enregistrement de la disponibilité.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(availabilityId: number) {
    try {
      setDeletingId(availabilityId);
      setError("");
      setMessage("");

      await deleteMyPractitionerAvailability(availabilityId);

      if (editingId === availabilityId) {
        resetForm();
      }

      setMessage("Disponibilité supprimée avec succès.");
      await loadAvailabilities();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la disponibilité.";
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
          Définissez et mettez à jour vos propres disponibilités pour votre
          agenda.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h2 className="font-semibold">
          {editingId
            ? "Modifier une disponibilité"
            : "Ajouter une disponibilité"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm text-black/60">Jour</label>
            <select
              name="weekday"
              value={form.weekday}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            >
              {weekdays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Disponibilité active
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm text-black/60">
              Heure de début
            </label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-black/60">
              Heure de fin
            </label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-teal-500 px-5 py-2 text-white hover:bg-teal-600 disabled:opacity-70"
            >
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Mettre à jour"
                  : "Ajouter"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 px-5 py-2 hover:bg-black/5"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
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

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-full bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-70"
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
