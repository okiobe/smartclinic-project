export type Role = "PATIENT" | "PRACTITIONER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  displayName: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
};

const KEY = "smartclinic_auth_mock";

function load(): AuthState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { isAuthenticated: false, user: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

function save(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

let state: AuthState = load();

export const authStore = {
  getState(): AuthState {
    return state;
  },
  loginAs(role: Role) {
    state = {
      isAuthenticated: true,
      user: {
        id: crypto.randomUUID(),
        email:
          role === "PATIENT"
            ? "patient@smartclinic.ca"
            : role === "PRACTITIONER"
              ? "practicien@smartclinic.ca"
              : "admin@smartclinic.ca",
        role,
        displayName:
          role === "PATIENT"
            ? "Patient Démo"
            : role === "PRACTITIONER"
              ? "Dr Praticien Démo"
              : "Admin Démo",
      },
    };
    save(state);
  },
  logout() {
    state = { isAuthenticated: false, user: null };
    save(state);
  },
};
