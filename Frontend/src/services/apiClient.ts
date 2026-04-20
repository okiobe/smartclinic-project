const API_BASE_URL = "http://localhost:8000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  const bodyIsFormData = isFormData(body);

  if (!bodyIsFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (method !== "GET") {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      requestHeaders["X-CSRFToken"] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    credentials: "include",
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : bodyIsFormData
          ? body
          : JSON.stringify(body),
  });

  let data: unknown = null;

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    let errorMessage = "Une erreur est survenue lors de la requête API.";

    if (typeof data === "object" && data !== null) {
      if (
        "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
      ) {
        errorMessage = (data as { detail: string }).detail;
      } else {
        const entries = Object.entries(data as Record<string, unknown>);

        const firstEntry = entries.find(([, value]) => {
          if (typeof value === "string") return true;
          if (Array.isArray(value) && typeof value[0] === "string") return true;
          return false;
        });

        if (firstEntry) {
          const [, value] = firstEntry;

          if (typeof value === "string") {
            errorMessage = value;
          } else if (Array.isArray(value) && typeof value[0] === "string") {
            errorMessage = value[0];
          }
        }
      }
    }

    throw new Error(errorMessage);
  }

  return data as T;
}

export { API_BASE_URL, apiRequest };
