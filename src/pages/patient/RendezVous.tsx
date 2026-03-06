export default function RendezVous() {
  // ceci est juste un code simulation avant l'intégration de l'API
  const appointments = [
    {
      id: "A-1001",
      date: "2026-03-08",
      time: "10:30",
      praticien: "Dr Tremblay",
      service: "Consultation",
      status: "Confirmé",
    },
    {
      id: "A-1002",
      date: "2026-03-18",
      time: "14:00",
      praticien: "Dr Bouchard",
      service: "Suivi",
      status: "En attente",
    },
    {
      id: "A-1003",
      date: "2026-03-19",
      time: "13:15",
      praticien: "Dr Maurice",
      service: "Consultation",
      status: "En attente",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <h1 className="text-xl font-semibold">Mes rendez-vous</h1>
        <p className="mt-2 text-black/60">
          Consultez vos rendez-vous à venir et gérez vos
          annulations/reprogrammations.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-black/60">
              <tr className="border-b border-black/10">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Heure</th>
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">Praticien</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3 pr-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-black/5">
                  <td className="py-3 pr-4">{a.date}</td>
                  <td className="py-3 pr-4">{a.time}</td>
                  <td className="py-3 pr-4">{a.service}</td>
                  <td className="py-3 pr-4">{a.praticien}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5">
                        Détails
                      </button>
                      <button className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-black/5">
                        Reprogrammer
                      </button>
                      <button className="rounded-full bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600">
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {appointments.length === 0 && (
                <tr>
                  <td className="py-6 text-black/60" colSpan={6}>
                    Aucun rendez-vous pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
