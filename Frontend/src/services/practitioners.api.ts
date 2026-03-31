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

export type CreateAvailabilityPayload = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
};

export type UpdateAvailabilityPayload = {
  weekday?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
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

export async function getAdminPractitionerAvailabilities(
  practitionerId: number,
): Promise<AvailabilityRule[]> {
  return apiRequest<AvailabilityRule[]>(
    `/admin/practitioners/${practitionerId}/availabilities/`,
    {
      method: "GET",
    },
  );
}

export async function createAdminPractitionerAvailability(
  practitionerId: number,
  payload: CreateAvailabilityPayload,
): Promise<AvailabilityRule> {
  return apiRequest<AvailabilityRule>(
    `/admin/practitioners/${practitionerId}/availabilities/`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function updateAdminAvailability(
  availabilityId: number,
  payload: UpdateAvailabilityPayload,
): Promise<AvailabilityRule> {
  return apiRequest<AvailabilityRule>(
    `/admin/availabilities/${availabilityId}/`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function deleteAdminAvailability(
  availabilityId: number,
): Promise<void> {
  await apiRequest(`/admin/availabilities/${availabilityId}/`, {
    method: "DELETE",
  });
}

export async function getMyPractitionerAvailabilities(): Promise<
  AvailabilityRule[]
> {
  return apiRequest<AvailabilityRule[]>("/practitioner/me/availabilities/", {
    method: "GET",
  });
}
