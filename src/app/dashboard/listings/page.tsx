'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Listing {
  id: string;
  title: string;
  state: string;
  city: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const listingsCollection = collection(db, 'listings');
        const listingSnapshot = await getDocs(listingsCollection);
        const listingsList = listingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Listing[];
        setListings(listingsList);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'listings', listingId));
        setListings(listings.filter(listing => listing.id !== listingId));
      } catch (err) {
        console.error('Error deleting listing:', err);
        setError('Failed to delete listing. Please try again later.');
      }
    }
  };

  const handleUpdateStatus = async (listingId: string, newStatus: 'active' | 'pending' | 'rejected') => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setListings(listings.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: newStatus, updatedAt: new Date().toISOString() } 
          : listing
      ));
    } catch (err) {
      console.error('Error updating listing status:', err);
      setError('Failed to update listing status. Please try again later.');
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesState = stateFilter === 'all' || listing.state === stateFilter;
    return matchesStatus && matchesState;
  });

  // Get unique states for filter
  const states = Array.from(new Set(listings.map(listing => listing.state))).sort();

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
        <h1 className="text-2xl font-semibold text-gray-900">Escort Listings Management</h1>
        <button
          onClick={() => router.push('/dashboard/listings/add')}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add New Listing
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="stateFilter" className="block text-sm font-medium text-gray-700">
            Filter by State
          </label>
          <select
            id="stateFilter"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          No listings found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {listing.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {listing.city}, {listing.state}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        listing.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/listings/${listing.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/listings/edit/${listing.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      {listing.status !== 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'active')}
                          className="text-xs text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                      {listing.status !== 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'pending')}
                          className="text-xs text-yellow-600 hover:text-yellow-900"
                        >
                          Pending
                        </button>
                      )}
                      {listing.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'rejected')}
                          className="text-xs text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
