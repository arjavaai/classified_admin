'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function getStartOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Custom', value: 'custom' },
];

export default function DashboardPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [adCount, setAdCount] = useState<number | null>(null);
  const [freeAdCount, setFreeAdCount] = useState<number | null>(null);
  const [premiumAdCount, setPremiumAdCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setUserCount(usersSnapshot.size);

        // Fetch ads from 'ads' collection
        const adsSnapshot = await getDocs(collection(db, 'ads'));
        setAdCount(adsSnapshot.size);
        let free = 0;
        let premium = 0;
        adsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.adType === 'premium') premium++;
          else if (data.adType === 'free') free++;
        });
        setFreeAdCount(free);
        setPremiumAdCount(premium);
      } catch (err) {
        setError('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-500">{error}</div>
        )}
        {loading ? (
          <div className="mt-8 text-center text-lg">Loading stats...</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={userCount ?? 0} icon="👥" />
            <StatCard label="Total Ads" value={adCount ?? 0} icon="📋" />
            <StatCard label="Free Ads" value={freeAdCount ?? 0} icon="🆓" />
            <StatCard label="Premium Ads" value={premiumAdCount ?? 0} icon="💎" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow flex flex-col items-center justify-center">
      <div className="mb-2 text-3xl">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}
