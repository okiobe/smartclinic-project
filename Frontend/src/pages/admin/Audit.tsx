import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAuditLogs,
  exportAuditLogsCsv,
  type AuditLog,
} from "../../services/audit.api";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActionBadgeClass(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-green-100 text-green-700";
    case "UPDATE":
      return "bg-blue-100 text-blue-700";
    case "DELETE":
      return "bg-red-100 text-red-700";
    case "STATUS_CHANGE":
      return "bg-yellow-100 text-yellow-700";
    case "CANCEL":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function Audit() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [error, setError] = useState("");

  const moduleFilter = searchParams.get("module") || "all";
  const actionFilter = searchParams.get("action") || "all";
  const roleFilter = searchParams.get("role") || "all";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = 10;

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const data = await getAuditLogs({
          module: moduleFilter,
          action: actionFilter,
          role: roleFilter,
          date_from: dateFrom,
          date_to: dateTo,
          q,
          page,
          page_size: pageSize,
        });

        setLogs(data.results);
        setCount(data.count);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de l’audit.",
        );
        setLogs([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [moduleFilter, actionFilter, roleFilter, dateFrom, dateTo, q, page]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);

    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    next.set("page", "1");
    setSearchParams(next);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (q) {
      next.set("q", q);
    }
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(safePage));
    setSearchParams(next);
  }

  async function handleExportCsv() {
    try {
      setExporting(true);
      setError("");

      await exportAuditLogsCsv({
        module: moduleFilter,
        action: actionFilter,
        role: roleFilter,
        date_from: dateFrom,
        date_to: dateTo,
        q,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l’export CSV.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">
              Journal d’audit
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Consultez l’historique des actions importantes effectuées dans
              SmartClinic.
            </p>
            {q ? (
              <p className="mt-3 text-sm text-[#2b6cb0]">
                Recherche active : <span className="font-semibold">{q}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowResults((prev) => !prev)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#0f172a] hover:bg-black/5"
            >
              {showResults ? "Masquer les résultats" : "Afficher les résultats"}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {exporting ? "Export en cours..." : "Exporter CSV"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <select
            value={moduleFilter}
            onChange={(e) => updateParam("module", e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          >
            <option value="all">Tous les modules</option>
            <option value="services">Services</option>
            <option value="practitioners">Praticiens</option>
            <option value="patients">Patients</option>
            <option value="appointments">Rendez-vous</option>
            <option value="soap">SOAP</option>
            <option value="soap_ai">SOAP IA</option>
            <option value="soap_audio">SOAP Audio</option>
            <option value="availability">Disponibilités</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => updateParam("action", e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          >
            <option value="all">Toutes les actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="CANCEL">CANCEL</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => updateParam("role", e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          >
            <option value="all">Tous les rôles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PRACTITIONER">PRACTITIONER</option>
            <option value="PATIENT">PATIENT</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParam("date_from", e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateParam("date_to", e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#0f172a] hover:bg-black/5"
          >
            Réinitialiser les filtres
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-black/10 bg-[#fcfcfb] px-4 py-3 text-sm text-black/60">
          {loading
            ? "Chargement des résultats..."
            : `${count} entrée(s) trouvée(s), page ${page} sur ${totalPages}.`}
        </div>
      </section>

      {showResults ? (
        <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-black/60">Chargement de l’audit...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-black/60">
              Aucune entrée d’audit trouvée.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-black/10 bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getActionBadgeClass(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-xs text-black/50">
                          Module : {log.module}
                        </span>
                        <span className="text-xs text-black/50">
                          Objet : {log.object_type}
                          {log.object_id ? ` #${log.object_id}` : ""}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#0f172a]">
                        {log.description}
                      </p>

                      <p className="mt-1 text-xs text-black/50">
                        Utilisateur : {log.user_display_name}{" "}
                        {log.user_email ? `(${log.user_email})` : ""} • Rôle :{" "}
                        {log.role || "—"}
                      </p>
                    </div>

                    <div className="text-xs text-black/50">
                      {formatDateTime(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && count > 0 ? (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#0f172a] hover:bg-black/5 disabled:opacity-50"
              >
                Précédent
              </button>

              <span className="text-sm text-black/60">
                Page {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#0f172a] hover:bg-black/5 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <p className="text-sm text-black/60">
            Les résultats de l’audit sont actuellement masqués.
          </p>
        </section>
      )}
    </div>
  );
}
