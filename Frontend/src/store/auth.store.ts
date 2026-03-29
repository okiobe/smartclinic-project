import { loginUser, logoutUser, getMe } from "../services/auth.api";
import type { AuthUser } from "../services/auth.api";

export type Role = "PATIENT" | "PRACTITIONER" | "ADMIN";

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
};

type Listener = () => void;

const KEY = "smartclinic_auth";
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

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

function clear() {
  localStorage.removeItem(KEY);
}

let state: AuthState = load();

export const authStore = {
  getState(): AuthState {
    return state;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async login(email: string, password: string) {
    const res = await loginUser({ email, password });

    state = {
      isAuthenticated: true,
      user: res.user,
    };

    save(state);
    emit();

    return res.user;
  },

  async hydrate() {
    try {
      const user = await getMe();

      state = {
        isAuthenticated: true,
        user,
      };

      save(state);
      emit();

      return user;
    } catch {
      state = {
        isAuthenticated: false,
        user: null,
      };

      clear();
      emit();

      return null;
    }
  },

  async logout() {
    try {
      await logoutUser();
    } catch {
      // ignore backend logout errors
    }

    state = {
      isAuthenticated: false,
      user: null,
    };

    clear();
    emit();
  },
};
