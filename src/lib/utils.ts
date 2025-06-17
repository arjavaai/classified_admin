import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Super admin configuration
export const SUPER_ADMIN_EMAIL = 'skluva.com@gmail.com';

// Check if user is super admin
export function isSuperAdmin(email: string | null | undefined): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

// Check if user object is super admin (for new auth system)
export function isSuperAdminUser(user: { email: string; role: string } | null): boolean {
  return user?.role === 'super_admin' && user?.email === SUPER_ADMIN_EMAIL;
} 