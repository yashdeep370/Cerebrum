const STORAGE_KEY = "cerebrum_app_password";

export function getStoredPassword(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setStoredPassword(password: string): void {
  localStorage.setItem(STORAGE_KEY, password);
}
