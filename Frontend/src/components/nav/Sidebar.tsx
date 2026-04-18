import { NavLink } from "react-router-dom";
import { authStore } from "../../store/auth.store";

const baseLink =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-black/5";
const activeLink = "bg-black/5 font-semibold";

export default function Sidebar() {
  const { user } = authStore.getState();

  const role = user?.role;

  const items =
    role === "PATIENT"
      ? [
          { to: "/patient/dashboard", label: "Tableau de bord" },
          { to: "/patient/appointments", label: "Mes rendez-vous" },
          { to: "/patient/profile", label: "Mon profil" },
        ]
      : role === "PRACTITIONER"
        ? [
            { to: "/practitioner/dashboard", label: "Tableau de bord" },
            { to: "/practitioner/schedule", label: "Agenda" },
            { to: "/practitioner/today", label: "Rendez-vous du jour" },
            { to: "/practitioner/availability", label: "Disponibilités" },
          ]
        : [
            { to: "/admin/dashboard", label: "Tableau de bord" },
            { to: "/admin/staff-planning", label: "Planning du personnel" },
            { to: "/admin/services", label: "Services" },
            { to: "/admin/practitioners", label: "Praticiens" },
            { to: "/admin/patients", label: "Patients" },
            { to: "/admin/settings", label: "Paramètres" },
          ];

  return (
    <aside className="w-[280px] min-h-screen border-r border-black/10 bg-[#f6f1e8]/80 backdrop-blur px-4 py-5">
      <div className="flex items-center gap-2 font-semibold">
        <span className="inline-block h-7 w-7 rounded-full bg-teal-500" />
        SmartClinic
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-white/50 p-3">
        <p className="text-xs text-black/60">Connecté</p>
        <p className="mt-1 text-sm font-semibold">{user?.displayName ?? "—"}</p>
        <p className="text-xs text-black/60">{user?.email ?? ""}</p>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : ""}`
            }
          >
            <span className="h-2 w-2 rounded-full bg-teal-500/70" />
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
