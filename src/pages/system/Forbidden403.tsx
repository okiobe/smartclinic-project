import { Link } from "react-router-dom";

export default function Forbidden403() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white/60 p-6 shadow-sm">
        <p className="text-sm text-black/60">Erreur 403</p>
        <h1 className="mt-2 text-2xl font-semibold">Accès refusé</h1>
        <p className="mt-3 text-black/60">
          Vous n’avez pas les autorisations nécessaires pour accéder à cette
          page.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-full bg-teal-500 px-4 py-2.5 text-sm text-white hover:bg-teal-600"
          >
            Aller à la connexion
          </Link>

          <Link
            to="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm hover:bg-black/5"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
