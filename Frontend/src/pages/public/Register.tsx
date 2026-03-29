import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/auth.api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message) setMessage("");
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.nom ||
      !form.prenom ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Veuillez remplir tous les champs.");
      setMessage("");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      await registerUser({
        email: form.email,
        first_name: form.prenom,
        last_name: form.nom,
        role: "PATIENT",
        password: form.password,
        password_confirm: form.confirmPassword,
      });

      setMessage("Inscription réussie ! Redirection vers la connexion...");
      setForm({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l’inscription.";
      setError(errorMessage);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0f172a]">
      <header className="sticky top-0 z-50 bg-[#f6f1e8]/80 backdrop-blur border-b border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-7 w-7 rounded-full bg-teal-500" />
            SmartClinic
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-black/70">
            <Link to="/#features" className="hover:text-black">
              Fonctionnalités
            </Link>
            <Link to="/#solutions" className="hover:text-black">
              Solutions
            </Link>
            <Link to="/#pricing" className="hover:text-black">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm border border-black/10 hover:bg-black/5"
            >
              Connexion clinique
            </Link>
            <Link
              to="/register"
              className="rounded-full px-4 py-2 text-sm bg-teal-500 text-white hover:bg-teal-600"
            >
              Inscription
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 md:grid-cols-2 md:items-center">
          <section>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mb-6"
            >
              ← Retour à l’accueil
            </Link>

            <p className="text-xs font-medium text-teal-600">SmartClinic</p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Créez votre compte
              <br />
              <span className="text-teal-500">
                et démarrez avec SmartClinic.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-black/60">
              Rejoignez une plateforme pensée pour les cliniques modernes :
              gestion simplifiée, réservation intelligente et outils assistés
              par IA pour gagner du temps au quotidien.
            </p>

            <div className="mt-8 space-y-4">
              <InfoItem text="Inscription rapide et interface moderne" />
              <InfoItem text="Accès futur au portail patient et clinique" />
              <InfoItem text="Expérience cohérente avec votre page d’accueil SmartClinic" />
            </div>

            <p className="mt-8 text-sm text-black/60">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/login"
                className="font-medium text-teal-600 hover:text-teal-700"
              >
                Connectez-vous
              </Link>
            </p>
          </section>

          <section>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Inscription</h2>
                <p className="mt-2 text-sm text-black/60">
                  Remplissez le formulaire pour créer votre compte.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Votre prénom"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Votre email"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez votre mot de passe"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Inscription..." : "S’inscrire"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-6 w-6 rounded-full border border-teal-500/20 bg-teal-500/15" />
      <p className="text-sm text-black/70">{text}</p>
    </div>
  );
}
