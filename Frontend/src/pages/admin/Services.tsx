import { useEffect, useRef, useState } from "react";
import {
  createService,
  deleteService,
  getAdminServices,
  updateService,
  type Service,
} from "../../services/services.api";

type CreateForm = {
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
};

type EditForm = {
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
};

const initialCreateForm: CreateForm = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: "",
  is_active: true,
};

const initialEditForm: EditForm = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: "",
  is_active: true,
};

function serviceToEditForm(service: Service): EditForm {
  return {
    name: service.name ?? "",
    description: service.description ?? "",
    duration_minutes: service.duration_minutes ?? 30,
    price: service.price ?? "",
    is_active: service.is_active ?? true,
  };
}

export default function Services() {
  const createSectionRef = useRef<HTMLElement | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [editForm, setEditForm] = useState<EditForm>(initialEditForm);

  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminServices();
      setServices(data);

      if (selectedService) {
        const refreshedSelected =
          data.find((service) => service.id === selectedService.id) ?? null;
        setSelectedService(refreshedSelected);
      }

      if (editingService) {
        const refreshedEditing =
          data.find((service) => service.id === editingService.id) ?? null;

        setEditingService(refreshedEditing);
        setEditForm(
          refreshedEditing
            ? serviceToEditForm(refreshedEditing)
            : initialEditForm,
        );
      }
    } catch {
      setError("Erreur lors du chargement des services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  function handleScrollToCreate() {
    createSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleCreateChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setCreateForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? target.checked
          : name === "duration_minutes"
            ? Number(value)
            : value,
    }));

    clearFeedback();
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? target.checked
          : name === "duration_minutes"
            ? Number(value)
            : value,
    }));

    clearFeedback();
  }

  function handleSelectService(service: Service) {
    const isSameService = selectedService?.id === service.id;

    if (isSameService && !editingService) {
      setSelectedService(null);
      clearFeedback();
      return;
    }

    setSelectedService(service);
    clearFeedback();
  }

  function handleOpenEditService(service: Service) {
    setSelectedService(service);
    setEditingService(service);
    setEditForm(serviceToEditForm(service));
    clearFeedback();
  }

  function handleCancelEdit() {
    setEditingService(null);
    setEditForm(initialEditForm);
    clearFeedback();
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!createForm.name.trim()) {
      setError("Le nom du service est obligatoire.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      const created = await createService({
        name: createForm.name,
        description: createForm.description,
        duration_minutes: Number(createForm.duration_minutes),
        price: createForm.price,
        is_active: createForm.is_active,
      });

      setServices((prev) => [...prev, created]);
      setCreateForm(initialCreateForm);
      setMessage("Service créé avec succès.");
      handleScrollToCreate();
    } catch {
      setError("Impossible de créer le service.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editingService) {
      setError("Veuillez sélectionner le bouton Modifier d'un service.");
      return;
    }

    if (!editForm.name.trim()) {
      setError("Le nom du service est obligatoire.");
      return;
    }

    try {
      setIsUpdating(true);
      setError("");
      setMessage("");

      const updated = await updateService(editingService.id, {
        name: editForm.name,
        description: editForm.description,
        duration_minutes: Number(editForm.duration_minutes),
        price: editForm.price,
        is_active: editForm.is_active,
      });

      setServices((prev) =>
        prev.map((service) => (service.id === updated.id ? updated : service)),
      );
      setSelectedService(updated);
      setEditingService(updated);
      setEditForm(serviceToEditForm(updated));
      setMessage("Service modifié avec succès.");
    } catch {
      setError("Impossible de modifier le service.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteService(serviceId: number) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce service ?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(serviceId);
      setError("");
      setMessage("");

      await deleteService(serviceId);

      const updatedList = services.filter(
        (service) => service.id !== serviceId,
      );
      setServices(updatedList);

      if (selectedService?.id === serviceId) {
        setSelectedService(null);
      }

      if (editingService?.id === serviceId) {
        setEditingService(null);
        setEditForm(initialEditForm);
      }

      setMessage("Service supprimé avec succès.");
    } catch {
      setError("Impossible de supprimer le service.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
            <p className="mt-1 text-sm text-slate-600">
              Créer, modifier ou supprimer les services de la clinique.
            </p>
          </div>

          <button
            type="button"
            onClick={handleScrollToCreate}
            className="rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            Ajouter service
          </button>
        </div>
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
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Liste des services</h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">
              Chargement des services...
            </p>
          ) : services.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Aucun service trouvé.</p>
          ) : (
            <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-2">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {service.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {service.description || "Aucune description"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Durée : {service.duration_minutes} min
                        </div>
                        <div className="text-xs text-slate-500">
                          Prix : {service.price ? `${service.price} $` : "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Statut : {service.is_active ? "Actif" : "Inactif"}
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="flex flex-col gap-2 border-t border-black/10 pt-3 sm:flex-row"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(service)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id)}
                            disabled={deletingId === service.id}
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-70"
                          >
                            {deletingId === service.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Modifier le service</h2>

          {!editingService ? (
            <p className="mt-4 text-sm text-slate-600">
              Sélectionne un service dans la liste, puis clique sur le bouton
              Modifier pour afficher ses informations ici.
            </p>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom
                </label>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={editForm.duration_minutes}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Prix
                  </label>
                  <input
                    name="price"
                    value={editForm.price}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={editForm.is_active}
                  onChange={handleEditChange}
                />
                Service actif
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
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section
        ref={createSectionRef}
        className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Créer un service</h2>

        <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              name="name"
              value={createForm.name}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={createForm.description}
              onChange={handleCreateChange}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Durée (minutes)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={createForm.duration_minutes}
                onChange={handleCreateChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Prix
              </label>
              <input
                name="price"
                value={createForm.price}
                onChange={handleCreateChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={createForm.is_active}
              onChange={handleCreateChange}
            />
            Service actif
          </label>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-70"
          >
            {isCreating ? "Création..." : "Créer le service"}
          </button>
        </form>
      </section>
    </div>
  );
}
