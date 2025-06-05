'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog } from '@headlessui/react';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  role?: string;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  price?: number;
  status?: string;
  adType?: string;
  [key: string]: any;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState('');
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [editAdLoading, setEditAdLoading] = useState(false);
  const [editAdError, setEditAdError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again later.');
      }
    }
  };

  const handleCheckAds = async (user: User) => {
    setSelectedUser(user);
    setShowAdsModal(true);
    setAdsLoading(true);
    setAdsError('');
    try {
      const adsSnapshot = await getDocs(collection(db, 'ads'));
      const adsList = adsSnapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .filter((ad: any) => String(ad.userId) === String(user.id));
      setUserAds(adsList as Ad[]);
    } catch (err) {
      setAdsError('Failed to load ads.');
    } finally {
      setAdsLoading(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      setUserAds(userAds.filter(ad => ad.id !== adId));
    } catch (err) {
      alert('Failed to delete ad.');
    }
  };

  const handleEditAd = (ad: Ad) => {
    setEditAd(ad);
    setEditAdError('');
  };

  const handleEditAdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editAd) return;
    setEditAd({ ...editAd, [e.target.name]: e.target.value });
  };

  const handleSaveAd = async () => {
    if (!editAd) return;
    setEditAdLoading(true);
    setEditAdError('');
    try {
      const { id, ...adData } = editAd;
      await updateDoc(doc(db, 'ads', id), adData);
      setUserAds(userAds.map(ad => (ad.id === id ? editAd : ad)));
      setEditAd(null);
    } catch (err) {
      setEditAdError('Failed to update ad.');
    } finally {
      setEditAdLoading(false);
    }
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Users Management</h1>
        <button
          onClick={() => router.push('/dashboard/users/add')}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add New User
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.id.substring(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.displayName || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/users/edit/${user.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleCheckAds(user)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Check Ads
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ads Modal */}
      <Dialog open={showAdsModal} onClose={() => { setShowAdsModal(false); setEditAd(null); }} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto p-6 z-10">
            <Dialog.Title className="text-lg font-bold mb-4">{selectedUser?.displayName || selectedUser?.email}'s Ads</Dialog.Title>
            {adsLoading ? (
              <div className="text-center py-8">Loading ads...</div>
            ) : adsError ? (
              <div className="text-red-500 py-8">{adsError}</div>
            ) : userAds.length === 0 ? (
              <div className="text-gray-500 py-8">No ads found for this user.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAds.map(ad => (
                  <div key={ad.id} className="bg-gray-50 rounded-lg shadow p-4 flex flex-col gap-2">
                    {editAd && editAd.id === ad.id ? (
                      <>
                        <input
                          className="border rounded px-2 py-1 mb-2"
                          name="title"
                          value={editAd.title}
                          onChange={handleEditAdChange}
                          placeholder="Title"
                        />
                        <textarea
                          className="border rounded px-2 py-1 mb-2"
                          name="description"
                          value={editAd.description}
                          onChange={handleEditAdChange}
                          placeholder="Description"
                        />
                        <input
                          className="border rounded px-2 py-1 mb-2"
                          name="price"
                          value={editAd.price || ''}
                          onChange={handleEditAdChange}
                          placeholder="Price"
                          type="number"
                        />
                        {/* Add more fields as needed */}
                        {editAdError && <div className="text-red-500 mb-2">{editAdError}</div>}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveAd}
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                            disabled={editAdLoading}
                          >
                            {editAdLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditAd(null)}
                            className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
                            disabled={editAdLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-lg">{ad.title || 'No Title'}</div>
                        <div className="text-gray-700 text-sm mb-1">{ad.description || 'No Description'}</div>
                        <div className="text-gray-500 text-xs mb-1">Type: {ad.adType || 'N/A'}</div>
                        <div className="text-gray-500 text-xs mb-1">Status: {ad.status || 'N/A'}</div>
                        <div className="text-gray-900 font-semibold mb-2">{ad.price ? `$${ad.price}` : 'No Price'}</div>
                        {/* Add more ad details as needed */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditAd(ad)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowAdsModal(false); setEditAd(null); }}
              className="mt-6 bg-gray-200 px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
