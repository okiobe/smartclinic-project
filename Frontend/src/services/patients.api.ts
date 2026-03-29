import { apiRequest } from "./apiClient";

export type PatientProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string | null;
  address: string;
  created_at: string;
};

export type AdminPatient = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

export async function getMyPatientProfile(): Promise<PatientProfile> {
  return apiRequest<PatientProfile>("/patients/me/", {
    method: "GET",
  });
}

export async function getAdminPatients(): Promise<AdminPatient[]> {
  return apiRequest<AdminPatient[]>("/admin/patients/", {
    method: "GET",
  });
}

export async function getAdminPatient(id: number): Promise<AdminPatient> {
  return apiRequest<AdminPatient>(`/admin/patients/${id}/`, {
    method: "GET",
  });
}

export async function deleteAdminPatient(id: number): Promise<void> {
  await apiRequest(`/admin/patients/${id}/`, {
    method: "DELETE",
  });
}
