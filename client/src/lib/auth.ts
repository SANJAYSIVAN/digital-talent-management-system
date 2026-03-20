const TOKEN_KEY = "token";
const USER_KEY = "user";

export type StoredUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
};

export const setAuthSession = (token: string, user: StoredUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): StoredUser | null => {
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
