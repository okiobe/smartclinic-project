import { apiRequest, API_BASE_URL } from "./apiClient";

export type AuditLog = {
  id: number;
  user: number | null;
  user_email: string | null;
  user_display_name: string;
  role: string;
  action: string;
  module: string;
  object_type: string;
  object_id: number | null;
  description: string;
  created_at: string;
};

export type PaginatedAuditLogs = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
};

type GetAuditLogsParams = {
  module?: string;
  action?: string;
  role?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  page?: number;
  page_size?: number;
};

function buildQueryString(params: GetAuditLogsParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {},
): Promise<PaginatedAuditLogs> {
  const queryString = buildQueryString(params);
  const endpoint = queryString
    ? `/admin/audit/?${queryString}`
    : "/admin/audit/";

  return apiRequest<PaginatedAuditLogs>(endpoint, {
    method: "GET",
  });
}

export async function exportAuditLogsCsv(
  params: GetAuditLogsParams = {},
): Promise<void> {
  const queryString = buildQueryString(params);
  const endpoint = queryString
    ? `${API_BASE_URL}/admin/audit/export/csv/?${queryString}`
    : `${API_BASE_URL}/admin/audit/export/csv/`;

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Impossible d’exporter le journal d’audit.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "audit_logs.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
