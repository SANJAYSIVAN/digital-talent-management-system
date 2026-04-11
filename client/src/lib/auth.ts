const TOKEN_KEY = "token";
const USER_KEY = "user";

export type StoredUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  skills?: string[];
  joinedDate?: string | null;
};

const isBrowser = () => typeof window !== "undefined";

export const setAuthSession = (token: string, user: StoredUser) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): StoredUser | null => {
  if (!isBrowser()) {
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
