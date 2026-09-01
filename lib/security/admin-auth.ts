import { AuthSession } from "../services/auth-service";

export function isAdminAuthorized(session: AuthSession, adminSecret?: string | null): boolean {
  if (session.role === "admin") return true;

  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  return Boolean(configuredSecret && adminSecret && adminSecret === configuredSecret);
}
