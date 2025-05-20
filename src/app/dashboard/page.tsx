'use client';

import { useRouter } from 'next/navigation';

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Users"
            description="Manage user accounts"
            icon="👥"
            href="/dashboard/users"
          />
          <DashboardCard
            title="Listings"
            description="Manage escort listings"
            icon="📋"
            href="/dashboard/listings"
          />
          <DashboardCard
            title="Location Pages"
            description="Manage state and city page content & SEO"
            icon="🌎"
            href="/dashboard/location-pages"
          />
          <DashboardCard
            title="Reports"
            description="View site analytics and reports"
            icon="📊"
            href="/dashboard/reports"
          />
          <DashboardCard
            title="Settings"
            description="Configure site settings"
            icon="⚙️"
            href="/dashboard/settings"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ 
  title, 
  description, 
  icon, 
  href 
}: { 
  title: string; 
  description: string; 
  icon: string; 
  href: string;
}) {
  const router = useRouter();
  
  return (
    <div 
      className="cursor-pointer rounded-lg bg-white p-6 shadow hover:shadow-md"
      onClick={() => router.push(href)}
    >
      <div className="mb-4 text-3xl">{icon}</div>
      <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
