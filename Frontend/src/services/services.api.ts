import { apiRequest } from "./apiClient";

export type Service = {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: string | null;
  is_active: boolean;
  created_at: string;
};

export type CreateServicePayload = {
  name: string;
  description: string;
  duration_minutes: number;
  price: string | null;
  is_active?: boolean;
};

export type UpdateServicePayload = {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: string | null;
  is_active?: boolean;
};

export async function getServices(
  endpoint: string = "/services/",
): Promise<Service[]> {
  return apiRequest<Service[]>(endpoint, {
    method: "GET",
  });
}

export async function getAdminServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/admin/services/", {
    method: "GET",
  });
}

export async function getServiceById(serviceId: number): Promise<Service> {
  return apiRequest<Service>(`/services/${serviceId}/`, {
    method: "GET",
  });
}

export async function createService(
  payload: CreateServicePayload,
): Promise<Service> {
  return apiRequest<Service>("/admin/services/", {
    method: "POST",
    body: payload,
  });
}

export async function updateService(
  serviceId: number,
  payload: UpdateServicePayload,
): Promise<Service> {
  return apiRequest<Service>(`/admin/services/${serviceId}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteService(serviceId: number): Promise<void> {
  await apiRequest(`/admin/services/${serviceId}/`, {
    method: "DELETE",
  });
}
