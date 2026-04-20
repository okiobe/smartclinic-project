import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../../store/auth.store";
import { apiRequest } from "../../services/apiClient";

type ChangePasswordForm = {
  email: string;
  old_password: string;
  new_password: string;
  new_password_confirm: string;
};

export default function Connexion() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] =
    useState<ChangePasswordForm>({
      email: "",
      old_password: "",
      new_password: "",
      new_password_confirm: "",
    });
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordMessage, setChangePasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  }

  function handleChangePasswordField(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setChangePasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (changePasswordError) setChangePasswordError("");
    if (changePasswordMessage) setChangePasswordMessage("");
  }

  async function ensureCsrfCookie() {
    await apiRequest<{ success: string }>("/auth/csrf/", {
      method: "GET",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await ensureCsrfCookie();

      const user = await authStore.login(form.email, form.password);

      if (user.role === "PATIENT") navigate("/patient/dashboard");
      else if (user.role === "PRACTITIONER")
        navigate("/practitioner/dashboard");
      else if (user.role === "ADMIN") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la connexion.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { email, old_password, new_password, new_password_confirm } =
      changePasswordForm;

    if (!email || !old_password || !new_password || !new_password_confirm) {
      setChangePasswordError("Veuillez remplir tous les champs.");
      return;
    }

    if (new_password !== new_password_confirm) {
      setChangePasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setIsChangingPassword(true);
      setChangePasswordError("");
      setChangePasswordMessage("");

      await ensureCsrfCookie();

      const response = await apiRequest<{ message: string }>(
        "/auth/change-password-from-login/",
        {
          method: "POST",
          body: {
            email,
            old_password,
            new_password,
            new_password_confirm,
          },
        },
      );

      setChangePasswordMessage(
        response.message ||
          "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.",
      );

      setChangePasswordForm({
        email: "",
        old_password: "",
        new_password: "",
        new_password_confirm: "",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de modifier le mot de passe.";
      setChangePasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  function toggleChangePassword() {
    setShowChangePassword((prev) => !prev);
    setChangePasswordError("");
    setChangePasswordMessage("");
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0f172a]">
      <header className="sticky top-0 z-50 bg-[#f6f1e8]/80 backdrop-blur border-b border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-7 w-7 rounded-full bg-teal-500" />
            SmartClinic
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="rounded-full px-4 py-2 text-sm border border-black/10 hover:bg-black/5"
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
              Connectez-vous
              <br />
              <span className="text-teal-500">à votre espace SmartClinic.</span>
            </h1>

            <p className="mt-5 max-w-xl text-black/60">
              Accédez à votre portail pour gérer vos rendez-vous, consulter vos
              informations et utiliser les fonctionnalités SmartClinic.
            </p>

            <div className="mt-8 space-y-4">
              <InfoItem text="Connexion sécurisée à votre compte" />
              <InfoItem text="Accès adapté selon votre rôle" />
              <InfoItem text="Expérience cohérente avec le portail SmartClinic" />
            </div>

            <p className="mt-8 text-sm text-black/60">
              Vous n’avez pas encore de compte ?{" "}
              <Link
                to="/register"
                className="font-medium text-teal-600 hover:text-teal-700"
              >
                Inscrivez-vous
              </Link>
            </p>
          </section>

          <section>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Connexion</h2>
                <p className="mt-2 text-sm text-black/60">
                  Entrez vos informations pour accéder à votre espace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
                <button
                  type="button"
                  onClick={toggleChangePassword}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  {showChangePassword
                    ? "Fermer le formulaire de changement de mot de passe"
                    : "Changer mon mot de passe"}
                </button>

                {showChangePassword && (
                  <form
                    onSubmit={handleChangePasswordSubmit}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={changePasswordForm.email}
                        onChange={handleChangePasswordField}
                        placeholder="Votre email"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Ancien mot de passe
                      </label>
                      <input
                        type="password"
                        name="old_password"
                        value={changePasswordForm.old_password}
                        onChange={handleChangePasswordField}
                        placeholder="Votre ancien mot de passe"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={changePasswordForm.new_password}
                        onChange={handleChangePasswordField}
                        placeholder="Votre nouveau mot de passe"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        name="new_password_confirm"
                        value={changePasswordForm.new_password_confirm}
                        onChange={handleChangePasswordField}
                        placeholder="Confirmez le nouveau mot de passe"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                      />
                    </div>

                    {changePasswordError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {changePasswordError}
                      </div>
                    )}

                    {changePasswordMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {changePasswordMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full rounded-full border border-teal-500 bg-white px-5 py-3 text-sm font-medium text-teal-600 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isChangingPassword
                        ? "Modification..."
                        : "Modifier le mot de passe"}
                    </button>
                  </form>
                )}
              </div>
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
