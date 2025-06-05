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
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState('');
  const [filter, setFilter] = useState('last7');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setPaymentsLoading(true);
        const paymentsSnapshot = await getDocs(collection(db, 'payments'));
        const paymentsList = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentsList);
      } catch (err) {
        setPaymentsError('Failed to load payments.');
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Filtering logic
  const now = new Date();
  let startDate: Date, endDate: Date;
  if (filter === 'today') {
    startDate = getStartOfDay(now);
    endDate = getEndOfDay(now);
  } else if (filter === 'last7') {
    startDate = getStartOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    endDate = getEndOfDay(now);
  } else if (filter === 'custom' && customStart && customEnd) {
    startDate = getStartOfDay(new Date(customStart));
    endDate = getEndOfDay(new Date(customEnd));
  } else {
    startDate = new Date(0);
    endDate = now;
  }

  const filteredPayments = payments.filter(p => {
    const date = p.paymentDate ? new Date(p.paymentDate) : (p.createdAt?.toDate ? p.createdAt.toDate() : null);
    if (!date) return false;
    // Only show status 'paid'
    if (p.paymentStatus !== 'paid') return false;
    return date >= startDate && date <= endDate;
  });

  // Chart data: group by day
  const chartMap = new Map<string, number>();
  filteredPayments.forEach(p => {
    const date = p.paymentDate ? new Date(p.paymentDate) : (p.createdAt?.toDate ? p.createdAt.toDate() : null);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    chartMap.set(key, (chartMap.get(key) || 0) + (typeof p.amountPaid === 'number' ? p.amountPaid : 0));
  });
  const chartData = Array.from(chartMap.entries()).map(([date, amount]) => ({ date, amount }));
  chartData.sort((a, b) => a.date.localeCompare(b.date));

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
        {/* Payments Section */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span role="img" aria-label="payments">💳</span> Payments
            </h2>
            <div className="flex gap-2 items-center mt-4 md:mt-0">
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  className={`px-3 py-1 rounded ${filter === f.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
              {filter === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="ml-2 border rounded px-2 py-1"
                  />
                  <span className="mx-1">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Payments Table */}
            <div className="flex-1 overflow-x-auto bg-white rounded shadow p-4">
              {paymentsLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : paymentsError ? (
                <div className="text-red-500 py-8">{paymentsError}</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-gray-500 py-8">No payments found for selected range.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Customer</th>
                      <th className="px-2 py-2 text-left">Email</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => {
                      const date = p.paymentDate ? new Date(p.paymentDate) : (p.createdAt?.toDate ? p.createdAt.toDate() : null);
                      return (
                        <tr key={p.id} className="border-t">
                          <td className="px-2 py-2">{date ? date.toLocaleDateString() : ''}</td>
                          <td className="px-2 py-2">{p.customerName || ''}</td>
                          <td className="px-2 py-2">{p.customerEmail || ''}</td>
                          <td className="px-2 py-2 text-right">{p.amountPaid ? `$${p.amountPaid}` : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {/* Payments Chart */}
            <div className="flex-1 bg-white rounded shadow p-4 min-h-[350px] flex flex-col">
              <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                <span role="img" aria-label="chart">📈</span> Payments Graph
              </h3>
              {paymentsLoading ? (
                <div className="flex-1 flex items-center justify-center">Loading chart...</div>
              ) : chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">No data for selected range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
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
