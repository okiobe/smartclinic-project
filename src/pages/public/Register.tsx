import { Link } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "",
    confirmationMotDePasse: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.motDePasse !== formData.confirmationMotDePasse) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    console.log("Données inscription :", formData);

    // À compléter pour l'appel vers le Backend
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Créer un compte</h1>
          <p className="mt-2 text-sm text-slate-500">
            Inscrivez-vous pour accéder à SmartClinic.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Prénom
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Votre prénom"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="exemple@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="********"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              name="confirmationMotDePasse"
              value={formData.confirmationMotDePasse}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-500 px-4 py-2.5 font-medium text-white transition hover:bg-teal-600"
          >
            Créer un compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Vous avez déjà un compte ?{" "}
          <Link
            to="/login"
            className="font-medium text-teal-600 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
