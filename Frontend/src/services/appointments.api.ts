import { apiRequest } from "./apiClient";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type SoapNote = {
  id: number;
  appointment?: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_at?: string;
  updated_at?: string;
};

export type Appointment = {
  id: number;

  patient: number;
  patient_email: string;
  patient_first_name: string;
  patient_last_name: string;

  practitioner: number;
  practitioner_email: string;
  practitioner_first_name: string;
  practitioner_last_name: string;

  service: number;
  service_name: string;

  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string;
  created_at?: string;

  soap_note?: SoapNote | null;
};

export type CreateAppointmentPayload = {
  patient?: number;
  practitioner: number;
  service: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  reason?: string;
};

export type UpdateAppointmentStatusPayload = {
  status: AppointmentStatus;
};

export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<Appointment> {
  return apiRequest<Appointment>("/appointments/", {
    method: "POST",
    body: payload,
  });
}

export async function getAppointments(
  endpoint: string = "/appointments/",
): Promise<Appointment[]> {
  return apiRequest<Appointment[]>(endpoint, {
    method: "GET",
  });
}

export async function getAppointmentDetail(
  appointmentId: number,
): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${appointmentId}/`, {
    method: "GET",
  });
}

export async function updateAppointmentStatus(
  appointmentId: number,
  payload: UpdateAppointmentStatusPayload,
): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${appointmentId}/status/`, {
    method: "PATCH",
    body: payload,
  });
}

// Helpers métier (IMPORTANT pour ton UI)
export async function confirmAppointment(
  appointmentId: number,
): Promise<Appointment> {
  return updateAppointmentStatus(appointmentId, { status: "CONFIRMED" });
}

export async function cancelAppointment(
  appointmentId: number,
): Promise<Appointment> {
  return updateAppointmentStatus(appointmentId, { status: "CANCELLED" });
}

export async function completeAppointment(
  appointmentId: number,
): Promise<Appointment> {
  return updateAppointmentStatus(appointmentId, { status: "COMPLETED" });
}
