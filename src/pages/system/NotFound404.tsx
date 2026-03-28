import { Link } from "react-router-dom";

export default function NotFound404() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white/60 p-6 shadow-sm">
        <p className="text-sm text-black/60">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-3 text-black/60">
          La page demandée n’existe pas ou a été déplacée.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-full bg-teal-500 px-4 py-2.5 text-sm text-white hover:bg-teal-600"
          >
            Retour à l’accueil
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm hover:bg-black/5"
          >
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
