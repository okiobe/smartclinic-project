export default function Reservation() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-[500px]">
        <h2 className="text-xl font-semibold mb-4">Réserver un rendez-vous</h2>

        <select className="border w-full p-2 rounded mb-4">
          <option>Choisir un service</option>
        </select>

        <select className="border w-full p-2 rounded mb-4">
          <option>Choisir un praticien</option>
        </select>

        <button className="bg-teal-500 text-white px-4 py-2 rounded">
          Continuer
        </button>
      </div>
    </div>
  );
}
