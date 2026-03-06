import { useNavigate } from "react-router-dom";
import { authStore } from "../../store/auth.store";

export default function Topbar() {
  const navigate = useNavigate();
  const { user } = authStore.getState();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f1e8]/80 backdrop-blur">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-black/60">Portail clinique</p>
          <p className="text-sm font-semibold">
            Bonjour, {user?.displayName ?? "—"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="hidden md:block w-[280px] rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm outline-none focus:border-teal-500"
            placeholder="Rechercher (patients, RDV...)"
          />

          <button
            className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm hover:bg-white/80"
            onClick={() => {
              authStore.logout();
              navigate("/login");
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
