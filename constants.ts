// TODO: Replace with your actual NestJS backend URL
// Set this to an empty string to enable Mock mode
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export const IS_MOCK_MODE = API_BASE_URL.length === 0;

export const THEME_COLORS = {
  primary: "blue-600",
  secondary: "slate-600",
  success: "emerald-500",
  danger: "rose-500",
  warning: "amber-500",
};
