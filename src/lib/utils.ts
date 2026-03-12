export function canManage(role: string): boolean {
  return ['admin', 'ADMIN', 'noc', 'NOC'].includes(role);
}
