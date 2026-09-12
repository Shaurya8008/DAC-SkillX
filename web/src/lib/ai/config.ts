export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

// Mirrors engine/app/config.py — real APIs are used only once the matching
// key is set, otherwise every service below falls back to a deterministic
// mock so the app runs with zero external accounts.
export const USE_REAL_AI = Boolean(GEMINI_API_KEY);
export const USE_REAL_GITHUB = Boolean(GITHUB_TOKEN);
