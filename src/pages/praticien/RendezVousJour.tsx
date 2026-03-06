type StatutRendezVous = "Confirmé" | "En attente" | "Annulé" | "Terminé";

type RendezVous = {
  id: number;
  heure: string;
  patient: string;
  motif: string;
  statut: StatutRendezVous;
};

type Props = {
  rendezVous?: RendezVous[];
};

export default function RendezVousJour({ rendezVous = [] }: Props) {
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

  if (rendezVous.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Aucun rendez-vous pour cette journée.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
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
          {rendezVous.map((rdv) => (
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
  );
}
