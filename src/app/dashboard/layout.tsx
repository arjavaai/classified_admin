'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => (
  <Link
    href={href}
    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
      active
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <span className="mr-3 text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isAdmin = isSuperAdminUser(user);

  // Debug logging
  console.log('Dashboard Layout Debug:', {
    user,
    isAdmin,
    userRole: user?.role,
    userEmail: user?.email
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        {/* Mobile menu button */}
        <div className="fixed left-0 top-0 z-20 block w-full bg-white p-4 shadow lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-10 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-center border-b border-gray-200">
              <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Debug Info - Remove this after testing */}
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <div>Current: {user?.email || 'Not logged in'}</div>
                <div>Role: {user?.role || 'None'}</div>
                <div>Super Admin: {isAdmin ? 'YES' : 'NO'}</div>
                <div>Required: skluva.com@gmail.com</div>
              </div>

              <nav className="space-y-2">
                <NavItem
                  href="/dashboard"
                  icon="📊"
                  label="Dashboard"
                  active={pathname === '/dashboard'}
                />
                
                {/* Super Admin Only - Create Ad */}
                {isAdmin && (
                  <NavItem
                    href="/dashboard/ads/create"
                    icon="➕"
                    label="Create Ad (Admin)"
                    active={pathname?.startsWith('/dashboard/ads/create')}
                  />
                )}
                
                {/* Show info for non-super-admin users */}
                {!isAdmin && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                    <div className="font-medium">Super Admin Required</div>
                    <div>Login with: skluva.com@gmail.com</div>
                    <div>to see Create Ad option</div>
                  </div>
                )}
                
                <NavItem
                  href="/dashboard/users"
                  icon="👥"
                  label="Users"
                  active={pathname?.startsWith('/dashboard/users')}
                />
                <NavItem
                  href="/dashboard/listings"
                  icon="📋"
                  label="Listings"
                  active={pathname?.startsWith('/dashboard/listings')}
                />
                <NavItem
                  href="/dashboard/location-pages"
                  icon="🌎"
                  label="Location Pages"
                  active={pathname?.startsWith('/dashboard/location-pages')}
                />
                <NavItem
                  href="/dashboard/blog-posts"
                  icon="📝"
                  label="Blog Posts"
                  active={pathname?.startsWith('/dashboard/blog-posts')}
                />
                <NavItem
                  href="/dashboard/pages"
                  icon="📄"
                  label="Pages"
                  active={pathname?.startsWith('/dashboard/pages')}
                />
              </nav>
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="mb-2 flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {isAdmin ? 'S' : 'A'}
                </div>
                <div className="ml-3 overflow-hidden text-sm">
                  <p className="truncate font-medium text-gray-700">
                    {isAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email || 'Administrator'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left text-sm text-red-600 hover:text-red-800 mt-2"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-0 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          <div className="min-h-screen pt-16 lg:pt-0">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
