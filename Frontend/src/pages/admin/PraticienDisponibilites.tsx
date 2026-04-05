import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createAdminPractitionerAvailability,
  deleteAdminAvailability,
  getAdminPractitionerAvailabilities,
  updateAdminAvailability,
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

export default function PraticienDisponibilites() {
  const { id } = useParams();
  const practitionerId = Number(id);

  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [form, setForm] = useState<AvailabilityForm>(initialForm);

  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAvailabilities() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminPractitionerAvailabilities(practitionerId);
      setAvailabilities(data);
    } catch {
      setError("Erreur lors du chargement des disponibilités.");
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (practitionerId) {
      loadAvailabilities();
    }
  }, [practitionerId]);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "weekday"
            ? Number(value)
            : value,
    }));
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      const created = await createAdminPractitionerAvailability(
        practitionerId,
        form,
      );

      setAvailabilities((prev) =>
        [...prev, created].sort((a, b) =>
          a.weekday === b.weekday
            ? a.start_time.localeCompare(b.start_time)
            : a.weekday - b.weekday,
        ),
      );

      setForm(initialForm);
      setMessage("Disponibilité ajoutée avec succès.");
    } catch {
      setError("Erreur lors de l'ajout de la disponibilité.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(item: AvailabilityRule) {
    try {
      setEditingId(item.id);
      setError("");
      setMessage("");

      const updated = await updateAdminAvailability(item.id, {
        is_active: !item.is_active,
      });

      setAvailabilities((prev) =>
        prev.map((availability) =>
          availability.id === updated.id ? updated : availability,
        ),
      );
    } catch {
      setError("Erreur lors de la mise à jour de la disponibilité.");
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(itemId: number) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette disponibilité ?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(itemId);
      setError("");
      setMessage("");

      await deleteAdminAvailability(itemId);
      setAvailabilities((prev) => prev.filter((item) => item.id !== itemId));
      setMessage("Disponibilité supprimée avec succès.");
    } catch {
      setError("Erreur lors de la suppression de la disponibilité.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Disponibilités du praticien</h1>
        <p className="mt-2 text-sm text-black/60">
          Définissez les plages horaires du praticien sélectionné.
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

      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h2 className="text-lg font-semibold">Ajouter une disponibilité</h2>

        <form
          onSubmit={handleCreateSubmit}
          className="mt-6 grid gap-4 md:grid-cols-4"
        >
          <select
            name="weekday"
            value={form.weekday}
            onChange={handleFormChange}
            className="rounded-xl border border-black/10 px-4 py-3 text-sm"
          >
            {weekdayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleFormChange}
            className="rounded-xl border border-black/10 px-4 py-3 text-sm"
          />

          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleFormChange}
            className="rounded-xl border border-black/10 px-4 py-3 text-sm"
          />

          <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleFormChange}
            />
            Actif
          </label>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-70"
            >
              {isCreating ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h2 className="text-lg font-semibold">Disponibilités existantes</h2>

        {loading ? (
          <p className="mt-4 text-sm text-black/60">
            Chargement des disponibilités...
          </p>
        ) : availabilities.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">
            Aucune disponibilité trouvée.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {availabilities.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">{item.weekday_display}</div>
                  <div className="text-sm text-black/60">
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    disabled={editingId === item.id}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:opacity-70"
                  >
                    {item.is_active ? "Désactiver" : "Activer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                  >
                    {deletingId === item.id ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
