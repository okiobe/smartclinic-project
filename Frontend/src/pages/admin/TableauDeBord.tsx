import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getAdminServices } from "../../services/services.api";
import { getAdminPractitioners } from "../../services/practitioners.api";
import { getAppointments } from "../../services/appointments.api";
import { getAdminPatients } from "../../services/patients.api";

type DashboardStats = {
  services: number;
  practitioners: number;
  patients: number;
  appointments: number;
};

const quickActions = [
  {
    title: "Gérer les services",
    description:
      "Créer, modifier ou supprimer les services proposés par la clinique.",
    to: "/admin/services",
    cta: "Ouvrir",
  },
  {
    title: "Gérer les praticiens",
    description:
      "Consulter les praticiens, modifier leurs profils et attribuer leurs services.",
    to: "/admin/practitioners",
    cta: "Ouvrir",
  },
  {
    title: "Gérer les patients",
    description:
      "Visualiser la liste des patients enregistrés dans la plateforme.",
    to: "/admin/patients",
    cta: "Ouvrir",
  },
  {
    title: "Paramètres",
    description: "Accéder aux réglages généraux de l’espace administrateur.",
    to: "/admin/settings",
    cta: "Ouvrir",
  },
];

export default function TableauDeBord() {
  const [stats, setStats] = useState<DashboardStats>({
    services: 0,
    practitioners: 0,
    patients: 0,
    appointments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        setError("");

        const [services, practitioners, patients, appointments] =
          await Promise.all([
            getAdminServices(),
            getAdminPractitioners(),
            getAdminPatients(),
            getAppointments(),
          ]);

        setStats({
          services: services.length,
          practitioners: practitioners.length,
          patients: patients.length,
          appointments: appointments.length,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du tableau de bord admin.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  const overviewStats = [
    {
      label: "Services",
      value: loading ? "--" : String(stats.services),
      help: "Nombre total de services",
    },
    {
      label: "Praticiens",
      value: loading ? "--" : String(stats.practitioners),
      help: "Nombre total de praticiens",
    },
    {
      label: "Patients",
      value: loading ? "--" : String(stats.patients),
      help: "Nombre total de patients",
    },
    {
      label: "Rendez-vous",
      value: loading ? "--" : String(stats.appointments),
      help: "Nombre total de rendez-vous",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2b6cb0]">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0f172a]">
              Tableau de bord admin
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-black/60">
              Bienvenue dans l’espace d’administration de SmartClinic. Utilisez
              ce tableau de bord pour accéder rapidement aux modules principaux
              de gestion.
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b6cb0]/15 bg-[#2b6cb0]/5 px-4 py-3 text-sm text-[#0f172a]">
            <p className="font-medium">Vue d’ensemble</p>
            <p className="mt-1 text-black/60">
              Données globales de la plateforme.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm"
          >
            <p className="text-sm text-black/60">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#0f172a]">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-black/50">{item.help}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Accès rapides
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Accédez directement aux principaux espaces de gestion.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <div
              key={action.to}
              className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-5"
            >
              <h3 className="text-base font-semibold text-[#0f172a]">
                {action.title}
              </h3>
              <p className="mt-2 text-sm text-black/60">{action.description}</p>

              <div className="mt-4">
                <Link
                  to={action.to}
                  className="inline-flex items-center rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {action.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Activités administratives
          </h2>
          <p className="mt-2 text-sm text-black/60">
            Cette section pourra afficher plus tard les informations clés :
            derniers praticiens ajoutés, derniers patients inscrits, services
            récemment modifiés, ou autres indicateurs utiles.
          </p>

          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[#fcfcfb] p-4 text-sm text-black/50">
            Aucun flux dynamique connecté pour l’instant.
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Prochaines améliorations
          </h2>

          <div className="mt-4 space-y-3 text-sm text-black/70">
            <div className="rounded-xl bg-[#f6f1e8] p-3">
              Ajouter les rendez-vous récents.
            </div>
            <div className="rounded-xl bg-[#f6f1e8] p-3">
              Ajouter les derniers patients inscrits.
            </div>
            <div className="rounded-xl bg-[#f6f1e8] p-3">
              Ajouter des indicateurs par statut de rendez-vous.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
