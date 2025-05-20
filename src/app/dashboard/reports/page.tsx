'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Import recharts components for data visualization
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Listing {
  id: string;
  title: string;
  state: string;
  city: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string;
  [key: string]: any; // Allow for additional properties
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  role?: string;
  [key: string]: any; // Allow for additional properties
}

interface StatsData {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  totalUsers: number;
  listingsByState: { name: string; value: number }[];
  listingsByStatus: { name: string; value: number }[];
  listingsCreatedByMonth: { name: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // Default to 30 days

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get date range for filtering
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(timeRange));
        
        // Fetch listings
        const listingsCollection = collection(db, 'listings');
        const listingSnapshot = await getDocs(listingsCollection);
        const listings = listingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Listing[];
        
        // Fetch users
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const users = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        
        // Calculate listings by state
        const stateCount: Record<string, number> = {};
        listings.forEach(listing => {
          const state = listing.state || 'Unknown';
          stateCount[state] = (stateCount[state] || 0) + 1;
        });
        
        const listingsByState = Object.entries(stateCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        
        // Calculate listings by status
        const statusCount = {
          active: listings.filter(l => l.status === 'active').length,
          pending: listings.filter(l => l.status === 'pending').length,
          rejected: listings.filter(l => l.status === 'rejected').length,
        };
        
        const listingsByStatus = [
          { name: 'Active', value: statusCount.active },
          { name: 'Pending', value: statusCount.pending },
          { name: 'Rejected', value: statusCount.rejected },
        ];
        
        // Calculate listings created by month
        const monthCount: Record<string, number> = {};
        listings.forEach(listing => {
          if (listing.createdAt) {
            const date = new Date(listing.createdAt);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            monthCount[monthYear] = (monthCount[monthYear] || 0) + 1;
          }
        });
        
        // Convert to array and sort by date
        const listingsCreatedByMonth = Object.entries(monthCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => {
            const [monthA, yearA] = a.name.split(' ');
            const [monthB, yearB] = b.name.split(' ');
            return new Date(`${monthA} 1, ${yearA}`).getTime() - new Date(`${monthB} 1, ${yearB}`).getTime();
          });
        
        // Set stats data
        setStats({
          totalListings: listings.length,
          activeListings: statusCount.active,
          pendingListings: statusCount.pending,
          rejectedListings: statusCount.rejected,
          totalUsers: users.length,
          listingsByState,
          listingsByStatus,
          listingsCreatedByMonth,
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reports</h1>
        <div>
          <label htmlFor="timeRange" className="mr-2 text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading statistics...</div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Listings" value={stats.totalListings} />
            <StatCard title="Active Listings" value={stats.activeListings} color="text-green-600" />
            <StatCard title="Pending Listings" value={stats.pendingListings} color="text-yellow-600" />
            <StatCard title="Rejected Listings" value={stats.rejectedListings} color="text-red-600" />
            <StatCard title="Total Users" value={stats.totalUsers} color="text-blue-600" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Listings by State */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Listings by State</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.listingsByState.slice(0, 10)} // Show top 10 states
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Listings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Listings by Status */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Listings by Status</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.listingsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.listingsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Listings Created by Month */}
            <div className="col-span-1 rounded-lg bg-white p-6 shadow lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Listings Created Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.listingsCreatedByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Listings Created" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          No data available.
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  color = 'text-gray-900' 
}: { 
  title: string; 
  value: number; 
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
