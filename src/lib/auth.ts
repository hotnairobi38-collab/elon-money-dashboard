export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(u: string) {
  return u.trim().toLowerCase();
}

/** Username-only login: auth needs an email, so we derive a fixed internal one. */
export function usernameToEmail(u: string) {
  return `${normalizeUsername(u)}@users.sockgate.local`;
}
