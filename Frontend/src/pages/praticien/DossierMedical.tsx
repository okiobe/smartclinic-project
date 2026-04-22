import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createAppointmentSoapNote,
  generateSoapWithAI,
  getAppointmentDetail,
  getAppointments,
  transcribeAppointmentAudio,
  updateAppointmentSoapNote,
  type Appointment,
  type SoapNotePayload,
} from "../../services/appointments.api";

type PatientSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type SoapFormState = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

function formatDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getAppointmentDateTime(appointment: Appointment) {
  return new Date(
    `${appointment.appointment_date}T${appointment.start_time}`,
  ).getTime();
}

function hasSoapContent(appointment: Appointment) {
  const soap = appointment.soap_note;

  return Boolean(
    soap &&
    (soap.subjective?.trim() ||
      soap.objective?.trim() ||
      soap.assessment?.trim() ||
      soap.plan?.trim()),
  );
}

function getInitialSoapForm(appointment: Appointment): SoapFormState {
  return {
    subjective: appointment.soap_note?.subjective ?? "",
    objective: appointment.soap_note?.objective ?? "",
    assessment: appointment.soap_note?.assessment ?? "",
    plan: appointment.soap_note?.plan ?? "",
  };
}

function getBestMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const candidate of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(candidate)
    ) {
      return candidate;
    }
  }

  return "";
}

function getFileExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export default function DossierMedical() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const appointmentIdParam = searchParams.get("appointmentId");
  const fromParam = searchParams.get("from");

  const targetAppointmentId = appointmentIdParam
    ? Number(appointmentIdParam)
    : null;
  const isSoapDraftMode = Boolean(targetAppointmentId);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [selectedDraftAppointment, setSelectedDraftAppointment] =
    useState<Appointment | null>(null);

  const [soapForm, setSoapForm] = useState<SoapFormState | null>(null);
  const [quickNotes, setQuickNotes] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadMedicalData() {
      try {
        setLoading(true);
        setError("");
        setMessage("");
        setAiMessage("");

        if (isSoapDraftMode && targetAppointmentId) {
          const appointment = await getAppointmentDetail(targetAppointmentId);
          setSelectedDraftAppointment(appointment);
          setSoapForm(getInitialSoapForm(appointment));
          return;
        }

        const data = await getAppointments("/appointments/");
        const withSoap = data
          .filter(hasSoapContent)
          .sort(
            (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a),
          );

        setAppointments(withSoap);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du dossier médical praticien.";
        setError(message);
        setAppointments([]);
        setSelectedDraftAppointment(null);
      } finally {
        setLoading(false);
      }
    }

    loadMedicalData();

    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isSoapDraftMode, targetAppointmentId]);

  const patients = useMemo(() => {
    const map = new Map<number, PatientSummary>();

    appointments.forEach((appointment) => {
      if (!map.has(appointment.patient)) {
        map.set(appointment.patient, {
          id: appointment.patient,
          first_name: appointment.patient_first_name,
          last_name: appointment.patient_last_name,
          email: appointment.patient_email,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`,
      ),
    );
  }, [appointments]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];

    return appointments
      .filter((appointment) => appointment.patient === selectedPatientId)
      .sort((a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a));
  }, [appointments, selectedPatientId]);

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null;

    return (
      selectedPatientAppointments.find(
        (appointment) => appointment.id === selectedAppointmentId,
      ) ?? null
    );
  }, [selectedAppointmentId, selectedPatientAppointments]);

  function handleSelectPatient(patientId: number) {
    setSelectedPatientId((current) => {
      if (current === patientId) {
        setSelectedAppointmentId(null);
        return null;
      }

      return patientId;
    });
    setSelectedAppointmentId(null);
  }

  function handleSoapChange(field: keyof SoapFormState, value: string) {
    setSoapForm((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev,
    );
    setError("");
    setMessage("");
    setAiMessage("");
  }

  function handleQuickNotesChange(value: string) {
    setQuickNotes(value);
    setError("");
    setMessage("");
    setAiMessage("");
  }

  async function handleAudioTranscription(file: File | null) {
    if (!file || !selectedDraftAppointment) return;

    try {
      setAudioLoading(true);
      setError("");
      setMessage("");
      setAiMessage("");

      const data = await transcribeAppointmentAudio(
        selectedDraftAppointment.id,
        file,
      );

      setQuickNotes(data.transcript ?? "");
      setAiMessage(
        "La dictée a été transcrite avec succès. Vous pouvez maintenant générer la note SOAP avec l’IA.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de transcrire le mémo vocal.",
      );
    } finally {
      setAudioLoading(false);
    }
  }

  async function handleStartRecording() {
    if (!selectedDraftAppointment) return;

    try {
      setError("");
      setAiMessage("");
      setMessage("");

      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setError(
          "Votre navigateur ne prend pas en charge l’enregistrement audio.",
        );
        return;
      }

      if (recording) {
        setError("Un enregistrement est déjà en cours.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setAudioLoading(true);

          const finalMimeType = recorder.mimeType || "audio/webm";
          const extension = getFileExtensionFromMimeType(finalMimeType);
          const audioBlob = new Blob(recordingChunksRef.current, {
            type: finalMimeType,
          });

          const audioFile = new File(
            [audioBlob],
            `memo-vocal-${selectedDraftAppointment.id}.${extension}`,
            {
              type: finalMimeType,
            },
          );

          const data = await transcribeAppointmentAudio(
            selectedDraftAppointment.id,
            audioFile,
          );

          setQuickNotes(data.transcript ?? "");
          setAiMessage(
            "La dictée a été transcrite avec succès. Vous pouvez maintenant générer la note SOAP avec l’IA.",
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de transcrire l’enregistrement audio.",
          );
        } finally {
          setAudioLoading(false);
          setRecording(false);
          recordingChunksRef.current = [];
          mediaRecorderRef.current = null;
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’accéder au microphone.",
      );
    }
  }

  function handleStopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  async function handleGenerateAI() {
    if (!selectedDraftAppointment) return;

    const notes = quickNotes.trim();

    if (!notes) {
      setError("Veuillez saisir ou transcrire des notes avant de lancer l’IA.");
      return;
    }

    try {
      setAiLoading(true);
      setError("");
      setMessage("");
      setAiMessage("");

      const aiDraft = await generateSoapWithAI(
        selectedDraftAppointment.id,
        notes,
      );

      setSoapForm({
        subjective: aiDraft.subjective ?? "",
        objective: aiDraft.objective ?? "",
        assessment: aiDraft.assessment ?? "",
        plan: aiDraft.plan ?? "",
      });

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
      setAiLoading(false);
    }
  }

  async function handleSaveSoap() {
    if (!selectedDraftAppointment || !soapForm) return;

    const payload: SoapNotePayload = {
      subjective: soapForm.subjective.trim(),
      objective: soapForm.objective.trim(),
      assessment: soapForm.assessment.trim(),
      plan: soapForm.plan.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setMessage("");
      setAiMessage("");

      if (selectedDraftAppointment.soap_note) {
        await updateAppointmentSoapNote(selectedDraftAppointment.id, payload);
      } else {
        await createAppointmentSoapNote(selectedDraftAppointment.id, payload);
      }

      setMessage("La note SOAP a été enregistrée avec succès.");

      if (fromParam === "history") {
        navigate("/practitioner/history");
        return;
      }

      const refreshed = await getAppointmentDetail(selectedDraftAppointment.id);
      setSelectedDraftAppointment(refreshed);
      setSoapForm(getInitialSoapForm(refreshed));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer la note SOAP.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <p className="text-sm text-black/60">
          Chargement du dossier médical...
        </p>
      </section>
    );
  }

  if (isSoapDraftMode && selectedDraftAppointment) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                Rédaction de la note SOAP
              </h1>
              <p className="mt-2 text-black/60">
                Saisissez ou complétez la note SOAP du rendez-vous sélectionné.
              </p>
            </div>

            <Link
              to="/practitioner/history"
              className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
            >
              Retour à l’historique
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {aiMessage && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            {aiMessage}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <div className="space-y-2 text-sm text-black/80">
              <p>
                <span className="font-medium">Patient :</span>{" "}
                {selectedDraftAppointment.patient_first_name}{" "}
                {selectedDraftAppointment.patient_last_name}
              </p>
              <p>
                <span className="font-medium">Date :</span>{" "}
                {formatDate(selectedDraftAppointment.appointment_date)}
              </p>
              <p>
                <span className="font-medium">Heure :</span>{" "}
                {formatTime(selectedDraftAppointment.start_time)} -{" "}
                {formatTime(selectedDraftAppointment.end_time)}
              </p>
              <p>
                <span className="font-medium">Service :</span>{" "}
                {selectedDraftAppointment.service_name}
              </p>
              <p>
                <span className="font-medium">Statut :</span>{" "}
                {selectedDraftAppointment.status}
              </p>
              <p>
                <span className="font-medium">Motif :</span>{" "}
                {selectedDraftAppointment.reason?.trim() || "Non renseigné"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <label className="mb-2 block text-sm font-medium text-violet-900">
              Notes rapides (IA)
            </label>

            <textarea
              value={quickNotes}
              onChange={(e) => handleQuickNotesChange(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
              placeholder="Ex: Douleur lombaire persistante, mobilité réduite, amélioration partielle..."
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5">
                {audioLoading ? "Transcription..." : "🎵 Importer un audio"}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) =>
                    handleAudioTranscription(e.target.files?.[0] ?? null)
                  }
                  disabled={audioLoading || recording}
                />
              </label>

              {recording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  disabled={audioLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                >
                  ⏹️ Arrêter l’enregistrement
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={audioLoading}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-70"
                >
                  🎤 Démarrer l’enregistrement
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-70"
              >
                {aiLoading ? "Génération..." : "✨ Générer avec IA"}
              </button>
            </div>
          </div>

          {soapForm && (
            <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Subjectif
                </label>
                <textarea
                  value={soapForm.subjective}
                  onChange={(e) =>
                    handleSoapChange("subjective", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Objectif
                </label>
                <textarea
                  value={soapForm.objective}
                  onChange={(e) =>
                    handleSoapChange("objective", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Évaluation
                </label>
                <textarea
                  value={soapForm.assessment}
                  onChange={(e) =>
                    handleSoapChange("assessment", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Plan
                </label>
                <textarea
                  value={soapForm.plan}
                  onChange={(e) => handleSoapChange("plan", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveSoap}
                  disabled={saving}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving
                    ? "Enregistrement..."
                    : selectedDraftAppointment.soap_note
                      ? "Mettre à jour la note SOAP"
                      : "Enregistrer la note SOAP"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/practitioner/history")}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                >
                  Retour à l’historique
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Dossier médical — Praticien
            </h1>
            <p className="mt-2 text-black/60">
              Consultez les patients suivis et l’ensemble des notes SOAP qui les
              concernent.
            </p>
          </div>

          <Link
            to="/practitioner/dashboard"
            className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Patients</h2>
            <span className="text-sm text-black/60">
              {patients.length} patient(s)
            </span>
          </div>

          {patients.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">
              Aucun patient avec note SOAP disponible.
            </p>
          ) : (
            <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-2">
              {patients.map((patient) => {
                const isSelected = selectedPatientId === patient.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-teal-400 bg-teal-50"
                        : "border-black/10 bg-white hover:bg-black/5"
                    }`}
                  >
                    <div className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-black/60">{patient.email}</div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/60 p-6">
          {!selectedPatientId ? (
            <div>
              <h2 className="text-lg font-semibold">Notes SOAP</h2>
              <p className="mt-2 text-sm text-black/60">
                Sélectionnez un patient pour afficher à droite l’ensemble des
                notes SOAP qui le concernent.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Notes SOAP du patient</h2>
                <p className="mt-2 text-sm text-black/60">
                  Sélectionnez une note pour consulter son contenu complet.
                </p>
              </div>

              {selectedPatientAppointments.length === 0 ? (
                <p className="text-sm text-black/60">
                  Aucune note SOAP disponible pour ce patient.
                </p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
                    {selectedPatientAppointments.map((appointment) => {
                      const isSelected =
                        selectedAppointmentId === appointment.id;

                      return (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() =>
                            setSelectedAppointmentId((current) =>
                              current === appointment.id
                                ? null
                                : appointment.id,
                            )
                          }
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-teal-400 bg-teal-50"
                              : "border-black/10 bg-white hover:bg-black/5"
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {appointment.service_name}
                            </p>
                            <p className="text-sm text-black/60">
                              {formatDate(appointment.appointment_date)} à{" "}
                              {formatTime(appointment.start_time)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-black/10 bg-white p-5">
                    {!selectedAppointment ? (
                      <div className="text-sm text-black/60">
                        Sélectionnez une note dans la liste pour consulter son
                        contenu complet.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {selectedAppointment.service_name}
                          </h3>
                          <p className="mt-1 text-sm text-black/60">
                            {formatDate(selectedAppointment.appointment_date)} à{" "}
                            {formatTime(selectedAppointment.start_time)}
                          </p>
                          <p className="text-sm text-black/60">
                            Patient : {selectedAppointment.patient_first_name}{" "}
                            {selectedAppointment.patient_last_name}
                          </p>
                        </div>

                        <div className="space-y-4 text-sm text-black/80">
                          <div>
                            <p className="font-medium text-black">Subjectif</p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedAppointment.soap_note?.subjective || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-black">Objectif</p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedAppointment.soap_note?.objective || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-black">Évaluation</p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedAppointment.soap_note?.assessment || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-black">Plan</p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedAppointment.soap_note?.plan || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
