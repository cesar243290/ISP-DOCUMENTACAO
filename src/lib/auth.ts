import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'NOC' | 'NOC_READONLY' | 'FIELD_TECH' | 'VIEWER';

export function canManage(role: UserRole): boolean {
  return ['ADMIN', 'NOC'].includes(role);
}

export function canRevealSecrets(role: UserRole): boolean {
  return ['ADMIN', 'NOC'].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
