export const AUTH_COOKIE = "fb_session";

export function setAuthCookie(uid: string) {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(uid)}; Path=/; Max-Age=${60*60*24*7}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}