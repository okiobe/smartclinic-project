import { Link } from "react-router-dom";

export default function TableauDeBord() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
      <h1 className="text-xl font-semibold">Tableau de bord — Patient</h1>
      <p className="mt-2 text-black/60">
        Prochains rendez-vous, rappels, actions rapides.
      </p>

      <div className="mt-6">
        <Link
          to="/booking"
          className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600"
        >
          Prendre un rendez-vous
        </Link>
      </div>
    </div>
  );
}
