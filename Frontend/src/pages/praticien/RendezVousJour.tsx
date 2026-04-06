import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  createAppointmentSoapNote,
  updateAppointmentSoapNote,
  generateSoapWithAI,
  type Appointment,
  type SoapNotePayload,
} from "../../services/appointments.api";

type StatutRendezVous = "Confirmé" | "En attente" | "Annulé" | "Terminé";

type SoapFormState = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

function formatStatus(status: string): StatutRendezVous {
  switch (status) {
    case "CONFIRMED":
      return "Confirmé";
    case "PENDING":
      return "En attente";
    case "CANCELLED":
      return "Annulé";
    case "COMPLETED":
      return "Terminé";
    default:
      return "En attente";
  }
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialSoapForm(appointment: Appointment): SoapFormState {
  return {
    subjective: appointment.soap_note?.subjective ?? "",
    objective: appointment.soap_note?.objective ?? "",
    assessment: appointment.soap_note?.assessment ?? "",
    plan: appointment.soap_note?.plan ?? "",
  };
}

export default function RendezVousJour() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [openSoapAppointmentId, setOpenSoapAppointmentId] = useState<
    number | null
  >(null);
  const [soapForms, setSoapForms] = useState<Record<number, SoapFormState>>({});
  const [soapLoadingId, setSoapLoadingId] = useState<number | null>(null);
  const [soapMessage, setSoapMessage] = useState("");

  const [quickNotes, setQuickNotes] = useState<Record<number, string>>({});
  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null);
  const [aiMessage, setAiMessage] = useState("");

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

  async function loadRendezVousJour() {
    try {
      setLoading(true);
      setError("");

      const today = getTodayDate();
      const data = await getAppointments(`/appointments/?date=${today}`);
      setAppointments(data);

      setSoapForms((prev) => {
        const next = { ...prev };

        for (const appointment of data) {
          if (!next[appointment.id]) {
            next[appointment.id] = getInitialSoapForm(appointment);
          } else if (appointment.soap_note) {
            next[appointment.id] = getInitialSoapForm(appointment);
          }
        }

        return next;
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous du jour.";
      setError(message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRendezVousJour();
  }, []);

  const rendezVous = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.appointment_date === getTodayDate())
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments]);

  async function handleConfirm(appointmentId: number) {
    try {
      setActionLoadingId(appointmentId);
      setError("");
      setSoapMessage("");
      setAiMessage("");
      await confirmAppointment(appointmentId);
      await loadRendezVousJour();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de confirmer ce rendez-vous.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancel(appointmentId: number) {
    try {
      setActionLoadingId(appointmentId);
      setError("");
      setSoapMessage("");
      setAiMessage("");
      await cancelAppointment(appointmentId);
      await loadRendezVousJour();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’annuler ce rendez-vous.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleComplete(appointmentId: number) {
    try {
      setActionLoadingId(appointmentId);
      setError("");
      setSoapMessage("");
      setAiMessage("");
      await completeAppointment(appointmentId);
      await loadRendezVousJour();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de terminer ce rendez-vous.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  function toggleSoapEditor(appointment: Appointment) {
    setError("");
    setSoapMessage("");
    setAiMessage("");

    setSoapForms((prev) => ({
      ...prev,
      [appointment.id]: getInitialSoapForm(appointment),
    }));

    setOpenSoapAppointmentId((current) =>
      current === appointment.id ? null : appointment.id,
    );
  }

  function handleSoapChange(
    appointmentId: number,
    field: keyof SoapFormState,
    value: string,
  ) {
    setSoapForms((prev) => ({
      ...prev,
      [appointmentId]: {
        ...(prev[appointmentId] ?? {
          subjective: "",
          objective: "",
          assessment: "",
          plan: "",
        }),
        [field]: value,
      },
    }));

    setError("");
    setSoapMessage("");
    setAiMessage("");
  }

  function handleQuickNotesChange(appointmentId: number, value: string) {
    setQuickNotes((prev) => ({
      ...prev,
      [appointmentId]: value,
    }));

    setError("");
    setAiMessage("");
  }

  async function handleGenerateAI(appointmentId: number) {
    const notes = (quickNotes[appointmentId] ?? "").trim();

    if (!notes) {
      setError("Veuillez saisir des notes rapides avant de lancer l’IA.");
      return;
    }

    try {
      setAiLoadingId(appointmentId);
      setError("");
      setAiMessage("");
      setSoapMessage("");

      const aiDraft = await generateSoapWithAI(appointmentId, notes);

      setSoapForms((prev) => ({
        ...prev,
        [appointmentId]: {
          subjective: aiDraft.subjective ?? "",
          objective: aiDraft.objective ?? "",
          assessment: aiDraft.assessment ?? "",
          plan: aiDraft.plan ?? "",
        },
      }));

      setAiMessage(
        "La proposition IA a été générée. Vérifiez et modifiez le contenu avant de sauvegarder.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de générer la note SOAP avec l’IA.",
      );
    } finally {
      setAiLoadingId(null);
    }
  }

  async function handleSoapSubmit(appointment: Appointment) {
    const form = soapForms[appointment.id] ?? getInitialSoapForm(appointment);

    const payload: SoapNotePayload = {
      subjective: form.subjective.trim(),
      objective: form.objective.trim(),
      assessment: form.assessment.trim(),
      plan: form.plan.trim(),
    };

    try {
      setSoapLoadingId(appointment.id);
      setError("");
      setSoapMessage("");
      setAiMessage("");

      if (appointment.soap_note) {
        await updateAppointmentSoapNote(appointment.id, payload);
        setSoapMessage("Note SOAP mise à jour avec succès.");
      } else {
        await createAppointmentSoapNote(appointment.id, payload);
        setSoapMessage("Note SOAP enregistrée avec succès.");
      }

      await loadRendezVousJour();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer la note SOAP.",
      );
    } finally {
      setSoapLoadingId(null);
    }
  }

  function renderActions(appointment: Appointment) {
    const isLoading = actionLoadingId === appointment.id;

    if (appointment.status === "PENDING") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleConfirm(appointment.id)}
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirmer
          </button>
          <button
            type="button"
            onClick={() => handleCancel(appointment.id)}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      );
    }

    if (appointment.status === "CONFIRMED") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleComplete(appointment.id)}
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Terminer
          </button>
          <button
            type="button"
            onClick={() => handleCancel(appointment.id)}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      );
    }

    return <span className="text-xs text-slate-400">Aucune action</span>;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Chargement des rendez-vous du jour...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Rendez-vous du jour
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Liste des rendez-vous prévus aujourd’hui uniquement.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {aiMessage && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
          {aiMessage}
        </div>
      )}

      {soapMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {soapMessage}
        </div>
      )}

      {rendezVous.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          Aucun rendez-vous pour aujourd’hui.
        </div>
      ) : (
        <div className="space-y-4">
          {rendezVous.map((appointment) => {
            const statut = formatStatus(appointment.status);
            const isSoapOpen = openSoapAppointmentId === appointment.id;
            const soapForm =
              soapForms[appointment.id] ?? getInitialSoapForm(appointment);
            const isSoapSaving = soapLoadingId === appointment.id;
            const isAiLoading = aiLoadingId === appointment.id;

            return (
              <div
                key={appointment.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >
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
                        <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                          Actions
                        </th>
                        <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                          Note SOAP
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {formatTime(appointment.start_time)} -{" "}
                          {formatTime(appointment.end_time)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-800">
                          {appointment.patient_first_name}{" "}
                          {appointment.patient_last_name}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {appointment.reason?.trim() ||
                            appointment.service_name}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                              statut,
                            )}`}
                          >
                            {statut}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm">
                          {renderActions(appointment)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm">
                          <button
                            type="button"
                            onClick={() => toggleSoapEditor(appointment)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {appointment.soap_note
                              ? "Voir / Modifier"
                              : "Rédiger"}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {isSoapOpen && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Note SOAP
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {appointment.soap_note
                            ? "Consultez ou modifiez la note SOAP associée à ce rendez-vous."
                            : "Rédigez la note SOAP associée à ce rendez-vous."}
                        </p>
                      </div>

                      {appointment.soap_note?.updated_at && (
                        <div className="text-xs text-slate-500">
                          Dernière mise à jour :{" "}
                          {new Date(
                            appointment.soap_note.updated_at,
                          ).toLocaleString("fr-CA")}
                        </div>
                      )}
                    </div>

                    <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                      <label className="mb-2 block text-sm font-medium text-violet-900">
                        Notes rapides (IA)
                      </label>
                      <textarea
                        value={quickNotes[appointment.id] ?? ""}
                        onChange={(e) =>
                          handleQuickNotesChange(appointment.id, e.target.value)
                        }
                        rows={3}
                        className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
                        placeholder="Ex: Douleur genou 7/10, amplitude limitée, chaleur appliquée..."
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleGenerateAI(appointment.id)}
                          disabled={isAiLoading}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isAiLoading ? "Génération..." : "✨ Générer avec IA"}
                        </button>

                        <p className="text-xs text-violet-700">
                          L’IA propose un brouillon. Vérifiez et modifiez avant
                          d’enregistrer.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Subjectif
                        </label>
                        <textarea
                          value={soapForm.subjective}
                          onChange={(e) =>
                            handleSoapChange(
                              appointment.id,
                              "subjective",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          placeholder="Symptômes rapportés par le patient, ressenti, historique pertinent..."
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Objectif
                        </label>
                        <textarea
                          value={soapForm.objective}
                          onChange={(e) =>
                            handleSoapChange(
                              appointment.id,
                              "objective",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          placeholder="Observations cliniques, signes mesurables, examen objectif..."
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Analyse
                        </label>
                        <textarea
                          value={soapForm.assessment}
                          onChange={(e) =>
                            handleSoapChange(
                              appointment.id,
                              "assessment",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          placeholder="Interprétation clinique, évaluation, hypothèses..."
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Plan
                        </label>
                        <textarea
                          value={soapForm.plan}
                          onChange={(e) =>
                            handleSoapChange(
                              appointment.id,
                              "plan",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          placeholder="Plan de traitement, recommandations, suivi..."
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSoapSubmit(appointment)}
                        disabled={isSoapSaving}
                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSoapSaving
                          ? "Enregistrement..."
                          : appointment.soap_note
                            ? "Mettre à jour la note SOAP"
                            : "Enregistrer la note SOAP"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenSoapAppointmentId(null)}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
