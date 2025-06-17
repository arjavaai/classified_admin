'use client';

import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/utils';
import CreateAdForm from '@/components/create-ad/create-ad-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminCreateAdPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!isSuperAdminUser(user)) {
        router.push('/dashboard');
        return;
      }
      
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-600">Unauthorized Access</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Admin: Create Ad</h1>
          <p className="mt-2 text-blue-100">Create ads without payment gateway as super admin</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CreateAdForm />
      </div>
    </div>
  );
} 