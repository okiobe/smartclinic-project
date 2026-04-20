import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authStore } from "../../store/auth.store";

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = authStore.getState();

  const isAuditPage = location.pathname === "/admin/audit";
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (isAuditPage) {
      setSearchValue(searchParams.get("q") || "");
    } else {
      setSearchValue("");
    }
  }, [isAuditPage, searchParams]);

  const greetingName = useMemo(() => {
    if (!user) return "—";

    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    return fullName || user.email || "—";
  }, [user]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAuditPage) {
      navigate(
        searchValue.trim()
          ? `/admin/audit?q=${encodeURIComponent(searchValue.trim())}`
          : "/admin/audit",
      );
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (searchValue.trim()) {
      next.set("q", searchValue.trim());
    } else {
      next.delete("q");
    }

    next.set("page", "1");
    setSearchParams(next);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f1e8]/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs text-black/60">Portail clinique</p>
          <p className="text-sm font-semibold">Bonjour, {greetingName}</p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit}>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="hidden w-[280px] rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm outline-none focus:border-teal-500 md:block"
              placeholder={
                isAuditPage
                  ? "Rechercher dans l’audit..."
                  : "Rechercher (patients, RDV...)"
              }
            />
          </form>

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
