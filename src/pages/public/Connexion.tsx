import { useNavigate } from "react-router-dom";
import { authStore } from "../../store/auth.store";
import type { Role } from "../../store/auth.store";

export default function Connexion() {
  const navigate = useNavigate();

  function login(role: Role) {
    authStore.loginAs(role);
    if (role === "PATIENT") navigate("/patient/dashboard");
    if (role === "PRACTITIONER") navigate("/practitioner/dashboard");
    if (role === "ADMIN") navigate("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/60 p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <p className="mt-1 text-sm text-black/60">
          (Mode démo) Choisissez un rôle pour accéder au portail.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            onClick={() => login("PATIENT")}
            className="rounded-full bg-teal-500 px-4 py-2.5 text-sm text-white hover:bg-teal-600"
          >
            Se connecter comme Patient
          </button>

          <button
            onClick={() => login("PRACTITIONER")}
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm hover:bg-black/5"
          >
            Se connecter comme Praticien
          </button>

          <button
            onClick={() => login("ADMIN")}
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm hover:bg-black/5"
          >
            Se connecter comme Administrateur
          </button>
        </div>
      </div>
    </div>
  );
}
