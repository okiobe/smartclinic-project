import { apiRequest } from "./apiClient";

export type PractitionerService = {
  service_id: number;
  service_name: string;
  duration_minutes: number;
  price: string | null;
};

export type Practitioner = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio: string;
  clinic_name: string;
  phone: string;
  services: PractitionerService[];
  created_at: string;
};

export type AvailabilityRule = {
  id: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
};

export type CreatePractitionerPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio: string;
  clinic_name: string;
  phone: string;
  service_ids: number[];
};

export type UpdatePractitionerPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  specialty?: string;
  bio?: string;
  clinic_name?: string;
  phone?: string;
  service_ids?: number[];
};

export async function getAdminPractitioners(): Promise<Practitioner[]> {
  return apiRequest<Practitioner[]>("/practitioners/admin/", {
    method: "GET",
  });
}

export async function createAdminPractitioner(
  payload: CreatePractitionerPayload,
): Promise<Practitioner> {
  return apiRequest<Practitioner>("/practitioners/admin/", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminPractitioner(
  practitionerId: number,
  payload: UpdatePractitionerPayload,
): Promise<Practitioner> {
  return apiRequest<Practitioner>(`/practitioners/admin/${practitionerId}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteAdminPractitioner(
  practitionerId: number,
): Promise<void> {
  await apiRequest(`/practitioners/admin/${practitionerId}/`, {
    method: "DELETE",
  });
}

export async function getPractitioners(
  endpoint: string = "/practitioners/",
): Promise<Practitioner[]> {
  return apiRequest<Practitioner[]>(endpoint, {
    method: "GET",
  });
}

export async function getPractitionerById(
  practitionerId: number,
): Promise<Practitioner> {
  return apiRequest<Practitioner>(`/practitioners/${practitionerId}/`, {
    method: "GET",
  });
}

export async function getPractitionerAvailability(
  practitionerId: number,
): Promise<AvailabilityRule[]> {
  return apiRequest<AvailabilityRule[]>(
    `/practitioners/${practitionerId}/availability/`,
    {
      method: "GET",
    },
  );
}
