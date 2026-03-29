import { apiRequest } from "./apiClient";

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
  status: string;
  reason: string;
  created_at?: string;
};

export type CreateAppointmentPayload = {
  patient: number;
  practitioner: number;
  service: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  reason?: string;
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
