/** Roles that can access every staff module (oversight / command center). */
export const OVERSIGHT_ROLES = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ADMIN', 'MEDICAL_DIRECTOR'];

export function normalizeRole(role) {
  return (role || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
}

export function isOversightRole(role) {
  return OVERSIGHT_ROLES.includes(normalizeRole(role));
}

export function hasAnyRole(userRole, allowedRoles = []) {
  const normalized = normalizeRole(userRole);
  if (isOversightRole(normalized)) return true;
  const allowed = allowedRoles.map((r) => normalizeRole(r));
  return allowed.includes(normalized);
}
