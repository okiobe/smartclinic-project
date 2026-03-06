import { useMemo, useState } from "react";

type StatutRendezVous = "Confirmé" | "En attente" | "Annulé" | "Terminé";

type RendezVous = {
  id: number;
  heure: string;
  patient: string;
  motif: string;
  statut: StatutRendezVous;
};

export default function Agenda() {
  const [dateSelectionnee, setDateSelectionnee] = useState(
    new Date().toISOString().split("T")[0],
  );

  const rendezVousDuJour = useMemo<RendezVous[]>(() => {
    return [
      {
        id: 1,
        heure: "08:30",
        patient: "Bernard Cecire",
        motif: "Consultation générale",
        statut: "Confirmé",
      },
      {
        id: 2,
        heure: "10:00",
        patient: "Ahmadou Traore",
        motif: "Suivi médical",
        statut: "En attente",
      },
      {
        id: 3,
        heure: "11:30",
        patient: "Jean Vespa",
        motif: "Contrôle annuel",
        statut: "Terminé",
      },
      {
        id: 4,
        heure: "14:00",
        patient: "Aïcha Kamga",
        motif: "Douleurs articulaires",
        statut: "Confirmé",
      },
      {
        id: 5,
        heure: "16:15",
        patient: "Samuel Lobe",
        motif: "Renouvellement ordonnance",
        statut: "Annulé",
      },
    ];
  }, [dateSelectionnee]);

  const getBadgeClass = (statut: StatutRendezVous) => {
    switch (statut) {
      case "Confirmé":
        return "bg-green-100 text-green-700";
      case "En attente":
        return "bg-yellow-100 text-yellow-700";
      case "Annulé":
        return "bg-red-100 text-red-700";
      case "Terminé":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Agenda du praticien
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Consultez les rendez-vous planifiés pour la journée.
            </p>
          </div>

          <div className="w-full md:w-64">
            <label
              htmlFor="date"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={dateSelectionnee}
              onChange={(e) => setDateSelectionnee(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Rendez-vous du {dateSelectionnee}
            </h2>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {rendezVousDuJour.length} rendez-vous
            </span>
          </div>

          {rendezVousDuJour.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              Aucun rendez-vous prévu pour cette date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Heure
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Patient
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Motif
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVousDuJour.map((rdv) => (
                    <tr key={rdv.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {rdv.heure}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-800">
                        {rdv.patient}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {rdv.motif}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                            rdv.statut,
                          )}`}
                        >
                          {rdv.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
