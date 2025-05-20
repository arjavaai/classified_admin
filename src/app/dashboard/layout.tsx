'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

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

  return (
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
            <nav className="space-y-2">
              <NavItem
                href="/dashboard"
                icon="📊"
                label="Dashboard"
                active={pathname === '/dashboard'}
              />
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
                href="/dashboard/reports"
                icon="📈"
                label="Reports"
                active={pathname?.startsWith('/dashboard/reports')}
              />
              <NavItem
                href="/dashboard/settings"
                icon="⚙️"
                label="Settings"
                active={pathname?.startsWith('/dashboard/settings')}
              />
            </nav>
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-2 flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                A
              </div>
              <div className="ml-3 overflow-hidden text-sm">
                <p className="truncate font-medium text-gray-700">Admin</p>
                <p className="truncate text-xs text-gray-500">Administrator</p>
              </div>
            </div>
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
  );
}
