import { useState } from "react";

type PatientProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  healthCard: string;
  address: string;
};

export default function Profil() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState<PatientProfile>({
    firstName: "Jean",
    lastName: "Tremblay",
    email: "jean.tremblay@email.com",
    phone: "514-555-1234",
    dateOfBirth: "1988-04-12",
    healthCard: "TREJ88041201",
    address: "123 Rue Saint-Denis, Montréal",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  function handleSave() {
    console.log("Profil sauvegardé", profile);
    setEditing(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Mon profil</h1>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm hover:bg-black/5"
            >
              Modifier
            </button>
          )}
        </div>

        <p className="mt-2 text-black/60 text-sm">
          Gérez vos informations personnelles et vos coordonnées.
        </p>
      </div>

      {/* Informations personnelles */}
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-4">
        <h2 className="font-semibold">Informations personnelles</h2>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Prénom"
            name="firstName"
            value={profile.firstName}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Nom"
            name="lastName"
            value={profile.lastName}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Date de naissance"
            name="dateOfBirth"
            type="date"
            value={profile.dateOfBirth}
            editing={editing}
            onChange={handleChange}
          />

          <InputField
            label="Numéro carte RAMQ"
            name="healthCard"
            value={profile.healthCard}
            editing={editing}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Coordonnées */}
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-4">
        <h2 className="font-semibold">Coordonnées</h2>

        <div className="grid grid-cols-2 gap-4">
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

          <div className="col-span-2">
            <InputField
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
            onClick={handleSave}
            className="rounded-full bg-teal-500 px-5 py-2 text-white hover:bg-teal-600"
          >
            Sauvegarder
          </button>

          <button
            onClick={() => setEditing(false)}
            className="rounded-full border border-black/10 px-5 py-2 hover:bg-black/5"
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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        <p className="mt-1 text-sm font-medium">{value}</p>
      )}
    </div>
  );
}
