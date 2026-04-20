import { apiRequest } from "./apiClient";

export type UserRole = "PATIENT" | "PRACTITIONER" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

export type RegisterPayload = {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  password: string;
  password_confirm: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};

export async function getCsrfToken(): Promise<void> {
  try {
    await apiRequest<void>("/auth/csrf/", { method: "GET" });
  } catch (e) {
    // ignore if it fails, maybe it already exists
  }
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthUser> {
  await getCsrfToken();
  return apiRequest<AuthUser>("/auth/register/", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  await getCsrfToken();
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: payload,
  });
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me/", {
    method: "GET",
  });
}

export async function logoutUser(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/logout/", {
    method: "POST",
  });
}

export type ChangePasswordFromLoginPayload = {
  email: string;
  old_password: string;
  new_password: string;
  new_password_confirm: string;
};

export async function changePasswordFromLogin(
  payload: ChangePasswordFromLoginPayload,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/change-password-from-login/", {
    method: "POST",
    body: payload,
  });
}
