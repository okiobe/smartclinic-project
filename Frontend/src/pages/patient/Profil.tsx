import { useEffect, useState } from "react";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
} from "../../services/patients.api";

type PatientProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
};

export default function Profil() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState<PatientProfileForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
  });

  const [initialProfile, setInitialProfile] = useState<PatientProfileForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const data = await getMyPatientProfile();

        const formattedProfile: PatientProfileForm = {
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          date_of_birth: data.date_of_birth ?? "",
          address: data.address ?? "",
        };

        setProfile(formattedProfile);
        setInitialProfile(formattedProfile);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du profil.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updated = await updateMyPatientProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth || null,
        address: profile.address,
      });

      const formattedProfile: PatientProfileForm = {
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
        date_of_birth: updated.date_of_birth ?? "",
        address: updated.address ?? "",
      };

      setProfile(formattedProfile);
      setInitialProfile(formattedProfile);
      setEditing(false);
      setMessage("Profil mis à jour avec succès.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde du profil.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setProfile(initialProfile);
    setEditing(false);
    setError("");
    setMessage("");
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 text-sm text-black/60">
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Mon profil</h1>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setError("");
                setMessage("");
              }}
              className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm hover:bg-black/5"
            >
              Modifier
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-black/60">
          Gérez vos informations personnelles et vos coordonnées.
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

      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-4">
        <h2 className="font-semibold">Informations personnelles</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Prénom"
            name="first_name"
            value={profile.first_name}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Nom"
            name="last_name"
            value={profile.last_name}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Date de naissance"
            name="date_of_birth"
            type="date"
            value={profile.date_of_birth}
            editing={editing}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-4">
        <h2 className="font-semibold">Coordonnées</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Courriel"
            name="email"
            value={profile.email}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Téléphone"
            name="phone"
            value={profile.phone}
            editing={editing}
            onChange={handleChange}
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="Adresse"
              name="address"
              value={profile.address}
              editing={editing}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {editing && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-teal-500 px-5 py-2 text-white hover:bg-teal-600 disabled:opacity-70"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-full border border-black/10 px-5 py-2 hover:bg-black/5 disabled:opacity-70"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

function InputField({
  label,
  name,
  value,
  editing,
  type = "text",
  onChange,
}: InputProps) {
  return (
    <div>
      <label className="text-sm text-black/60">{label}</label>

      {editing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
        />
      ) : (
        <p className="mt-1 text-sm font-medium">{value || "—"}</p>
      )}
    </div>
  );
}

function TextAreaField({ label, name, value, editing, onChange }: InputProps) {
  return (
    <div>
      <label className="text-sm text-black/60">{label}</label>

      {editing ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={3}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
        />
      ) : (
        <p className="mt-1 text-sm font-medium whitespace-pre-line">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
