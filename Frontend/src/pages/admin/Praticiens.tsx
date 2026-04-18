import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAdminPractitioner,
  deleteAdminPractitioner,
  getAdminPractitioners,
  updateAdminPractitioner,
  type Practitioner,
} from "../../services/practitioners.api";
import { getAdminServices, type Service } from "../../services/services.api";

type CreateForm = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio: string;
  clinic_name: string;
  phone: string;
  service_ids: number[];
};

type EditForm = {
  email: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio: string;
  clinic_name: string;
  phone: string;
  service_ids: number[];
};

const initialCreateForm: CreateForm = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  specialty: "",
  bio: "",
  clinic_name: "",
  phone: "",
  service_ids: [],
};

const initialEditForm: EditForm = {
  email: "",
  first_name: "",
  last_name: "",
  specialty: "",
  bio: "",
  clinic_name: "",
  phone: "",
  service_ids: [],
};

function practitionerToEditForm(practitioner: Practitioner): EditForm {
  return {
    email: practitioner.email ?? "",
    first_name: practitioner.first_name ?? "",
    last_name: practitioner.last_name ?? "",
    specialty: practitioner.specialty ?? "",
    bio: practitioner.bio ?? "",
    clinic_name: practitioner.clinic_name ?? "",
    phone: practitioner.phone ?? "",
    service_ids: practitioner.services.map((service) => service.service_id),
  };
}

function normalizeCreateForm(form: CreateForm): CreateForm {
  return {
    ...form,
    email: form.email.trim(),
    password: form.password.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    specialty: form.specialty.trim(),
    bio: form.bio.trim(),
    clinic_name: form.clinic_name.trim(),
    phone: form.phone.trim(),
  };
}

function normalizeEditForm(form: EditForm): EditForm {
  return {
    ...form,
    email: form.email.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    specialty: form.specialty.trim(),
    bio: form.bio.trim(),
    clinic_name: form.clinic_name.trim(),
    phone: form.phone.trim(),
  };
}

export default function Praticiens() {
  const navigate = useNavigate();

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [editForm, setEditForm] = useState<EditForm>(initialEditForm);

  const [selectedPractitioner, setSelectedPractitioner] =
    useState<Practitioner | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPractitioners() {
    const data = await getAdminPractitioners();
    setPractitioners(data);

    if (selectedPractitioner) {
      const refreshedSelected =
        data.find((p) => p.id === selectedPractitioner.id) ?? null;

      setSelectedPractitioner(refreshedSelected);
      setEditForm(
        refreshedSelected
          ? practitionerToEditForm(refreshedSelected)
          : initialEditForm,
      );
    }
  }

  async function loadServices() {
    setLoadingServices(true);
    try {
      const data = await getAdminServices();
      setServices(data);
    } catch {
      setServices([]);
      throw new Error("Impossible de charger les services.");
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadPractitioners(), loadServices()]);
    } catch {
      setError("Erreur lors du chargement des praticiens et des services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  function handleCreateChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  function handleCreateServiceToggle(serviceId: number) {
    setCreateForm((prev) => {
      const alreadySelected = prev.service_ids.includes(serviceId);

      return {
        ...prev,
        service_ids: alreadySelected
          ? prev.service_ids.filter((id) => id !== serviceId)
          : [...prev.service_ids, serviceId],
      };
    });

    clearFeedback();
  }

  function handleEditServiceToggle(serviceId: number) {
    setEditForm((prev) => {
      const alreadySelected = prev.service_ids.includes(serviceId);

      return {
        ...prev,
        service_ids: alreadySelected
          ? prev.service_ids.filter((id) => id !== serviceId)
          : [...prev.service_ids, serviceId],
      };
    });

    clearFeedback();
  }

  function handleSelectPractitioner(practitioner: Practitioner) {
    setSelectedPractitioner(practitioner);
    setEditForm(practitionerToEditForm(practitioner));
    clearFeedback();
  }

  function handleCancelEdit() {
    setSelectedPractitioner(null);
    setEditForm(initialEditForm);
    clearFeedback();
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = normalizeCreateForm(createForm);

    if (
      !payload.email ||
      !payload.password ||
      !payload.first_name ||
      !payload.last_name
    ) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      await createAdminPractitioner(payload);

      setMessage("Praticien créé avec succès.");
      setCreateForm(initialCreateForm);
      await loadPractitioners();
    } catch {
      setError("Erreur lors de la création du praticien.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedPractitioner) {
      setError("Veuillez sélectionner un praticien à modifier.");
      return;
    }

    const payload = normalizeEditForm(editForm);

    if (!payload.email || !payload.first_name || !payload.last_name) {
      setError("Les champs prénom, nom et email sont obligatoires.");
      return;
    }

    try {
      setIsUpdating(true);
      setError("");
      setMessage("");

      const updated = await updateAdminPractitioner(
        selectedPractitioner.id,
        payload,
      );

      setPractitioners((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setSelectedPractitioner(updated);
      setEditForm(practitionerToEditForm(updated));
      setMessage("Praticien modifié avec succès.");
    } catch {
      setError("Erreur lors de la modification du praticien.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeletePractitioner(practitionerId: number) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce praticien ?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(practitionerId);
      setError("");
      setMessage("");

      await deleteAdminPractitioner(practitionerId);

      const updatedList = practitioners.filter((p) => p.id !== practitionerId);
      setPractitioners(updatedList);

      if (selectedPractitioner?.id === practitionerId) {
        setSelectedPractitioner(null);
        setEditForm(initialEditForm);
      }

      setMessage("Praticien supprimé avec succès.");
    } catch {
      setError("Erreur lors de la suppression du praticien.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Praticiens — Administrateur</h1>
        <p className="mt-2 text-black/60">
          Création, modification et suppression des praticiens de la clinique.
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <h2 className="text-lg font-semibold">Créer un praticien</h2>

          <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={createForm.email}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={createForm.password}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="first_name"
                placeholder="Prénom"
                value={createForm.first_name}
                onChange={handleCreateChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
              <input
                name="last_name"
                placeholder="Nom"
                value={createForm.last_name}
                onChange={handleCreateChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
            </div>

            <input
              name="specialty"
              placeholder="Spécialité"
              value={createForm.specialty}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <input
              name="clinic_name"
              placeholder="Clinique"
              value={createForm.clinic_name}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <input
              name="phone"
              placeholder="Téléphone"
              value={createForm.phone}
              onChange={handleCreateChange}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <textarea
              name="bio"
              placeholder="Bio"
              value={createForm.bio}
              onChange={handleCreateChange}
              rows={3}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />

            <div>
              <label className="mb-2 block text-sm font-medium">
                Services offerts
              </label>

              {loadingServices ? (
                <p className="text-sm text-black/60">
                  Chargement des services...
                </p>
              ) : services.length === 0 ? (
                <p className="text-sm text-black/60">
                  Aucun service disponible.
                </p>
              ) : (
                <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.service_ids.includes(service.id)}
                        onChange={() => handleCreateServiceToggle(service.id)}
                        className="mt-1 h-4 w-4 rounded border-black/20"
                      />
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-xs text-black/50">
                          {service.duration_minutes} min
                          {service.price ? ` • ${service.price} $` : ""}
                        </div>
                        {service.description && (
                          <div className="text-xs text-black/50">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-70"
            >
              {isCreating ? "Création..." : "Créer"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <h2 className="text-lg font-semibold">Modifier un praticien</h2>

          {!selectedPractitioner ? (
            <p className="mt-4 text-sm text-black/60">
              Sélectionne un praticien dans la liste ci-dessous pour modifier
              son profil.
            </p>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={editForm.email}
                onChange={handleEditChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="first_name"
                  placeholder="Prénom"
                  value={editForm.first_name}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
                <input
                  name="last_name"
                  placeholder="Nom"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <input
                name="specialty"
                placeholder="Spécialité"
                value={editForm.specialty}
                onChange={handleEditChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />

              <input
                name="clinic_name"
                placeholder="Clinique"
                value={editForm.clinic_name}
                onChange={handleEditChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />

              <input
                name="phone"
                placeholder="Téléphone"
                value={editForm.phone}
                onChange={handleEditChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />

              <textarea
                name="bio"
                placeholder="Bio"
                value={editForm.bio}
                onChange={handleEditChange}
                rows={3}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Services offerts
                </label>

                {loadingServices ? (
                  <p className="text-sm text-black/60">
                    Chargement des services...
                  </p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-black/60">
                    Aucun service disponible.
                  </p>
                ) : (
                  <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={editForm.service_ids.includes(service.id)}
                          onChange={() => handleEditServiceToggle(service.id)}
                          className="mt-1 h-4 w-4 rounded border-black/20"
                        />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-black/50">
                            {service.duration_minutes} min
                            {service.price ? ` • ${service.price} $` : ""}
                          </div>
                          {service.description && (
                            <div className="text-xs text-black/50">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {isUpdating ? "Enregistrement..." : "Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h2 className="text-lg font-semibold">Liste des praticiens</h2>

        {loading ? (
          <p className="mt-4 text-sm text-black/60">
            Chargement des praticiens...
          </p>
        ) : practitioners.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">Aucun praticien trouvé.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {practitioners.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 ${
                  selectedPractitioner?.id === p.id
                    ? "border-teal-400 bg-teal-50"
                    : "border-black/10"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="font-medium">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-sm text-black/60">
                      {p.specialty || "Aucune spécialité"}
                    </div>
                    <div className="text-xs text-black/50">{p.email}</div>
                    {p.clinic_name && (
                      <div className="mt-1 text-xs text-black/50">
                        Clinique : {p.clinic_name}
                      </div>
                    )}
                    {p.phone && (
                      <div className="text-xs text-black/50">
                        Téléphone : {p.phone}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.services.length > 0 ? (
                        p.services.map((service) => (
                          <span
                            key={service.service_id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                          >
                            {service.service_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-black/40">
                          Aucun service associé
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPractitioner(p)}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/practitioners/${p.id}/availabilities`)
                      }
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5"
                    >
                      Disponibilités
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePractitioner(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                    >
                      {deletingId === p.id ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
