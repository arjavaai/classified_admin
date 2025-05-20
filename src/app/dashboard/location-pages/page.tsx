'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, X, Eye, Edit, Trash2 } from 'lucide-react';

interface LocationPage {
  id: string;
  type: 'state' | 'city';
  state: string;
  city?: string;
  title: string;
  metaDescription: string;
  h1Title: string;
  content: string;
  updatedAt: string;
}

interface ViewModalProps {
  page: LocationPage | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

// View Modal Component
function ViewModal({ page, onClose, onEdit }: ViewModalProps) {
  if (!page) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <X size={24} />
        </button>
        
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {page.type === 'state' ? page.state : `${page.city}, ${page.state}`} Page Details
        </h2>
        
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">Page Type</h3>
            <p className="text-gray-700">
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${page.type === 'state' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {page.type === 'state' ? 'State' : 'City'}
              </span>
            </p>
          </div>
          
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">Location</h3>
            <p className="text-gray-700">
              {page.state}{page.city ? `, ${page.city}` : ''}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-gray-900">Meta Title</h3>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
            {page.title}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-gray-900">Meta Description</h3>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
            {page.metaDescription}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-gray-900">H1 Title</h3>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
            {page.h1Title}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-gray-900">Content</h3>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => page && onEdit(page.id)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 cursor-pointer flex items-center"
          >
            <Edit size={16} className="mr-2" /> Edit Page
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationPagesPage() {
  const router = useRouter();
  const [locationPages, setLocationPages] = useState<LocationPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'state' | 'city'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewPage, setViewPage] = useState<LocationPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationPages = async () => {
      try {
        setIsLoading(true);
        const locationPagesCollection = collection(db, 'locationPages');
        const locationPagesSnapshot = await getDocs(locationPagesCollection);
        const locationPagesList = locationPagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LocationPage[];
        setLocationPages(locationPagesList);
      } catch (err) {
        console.error('Error fetching location pages:', err);
        setError('Failed to load location pages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationPages();
  }, []);

  // Get unique states for filter
  const states = Array.from(new Set(locationPages.map(page => page.state))).sort();

  // Handle page deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeleteId(id);
      
      const pageRef = doc(db, 'locationPages', id);
      await deleteDoc(pageRef);
      
      // Update the state to remove the deleted page
      setLocationPages(prevPages => prevPages.filter(page => page.id !== id));
    } catch (err) {
      console.error('Error deleting location page:', err);
      setError('Failed to delete the page. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };
  
  // Filter location pages based on selected filters and search term
  const filteredLocationPages = locationPages.filter(page => {
    const matchesType = filter === 'all' || page.type === filter;
    const matchesState = stateFilter === 'all' || page.state === stateFilter;
    
    // Search term filter
    const search = searchTerm.toLowerCase();
    const matchesSearch = search === '' || 
      page.state.toLowerCase().includes(search) || 
      (page.city && page.city.toLowerCase().includes(search)) || 
      page.title.toLowerCase().includes(search);
    
    return matchesType && matchesState && matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Location Pages</h1>
        <button
          onClick={() => router.push('/dashboard/location-pages/add')}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 cursor-pointer"
        >
          Add New Page
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by state, city, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border border-gray-300 pl-10 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700">
            Filter by Type
          </label>
          <select
            id="typeFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'state' | 'city')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="state">State Pages</option>
            <option value="city">City Pages</option>
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading location pages...</div>
      ) : filteredLocationPages.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          <p className="text-gray-900">No location pages found.</p>
          <p className="mt-2 text-sm text-gray-500">
            Create your first location page by clicking the &quot;Add New Page&quot; button above.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLocationPages.map((page) => (
                  <tr key={page.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          page.type === 'state'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {page.type === 'state' ? 'State' : 'City'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {page.state}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {page.city || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {page.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setViewPage(page)}
                          className="text-green-600 hover:text-green-900 flex items-center cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/location-pages/edit/${page.id}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center cursor-pointer"
                          title="Edit Page"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:text-red-900 flex items-center cursor-pointer"
                          disabled={isDeleting && deleteId === page.id}
                          title="Delete Page"
                        >
                          {isDeleting && deleteId === page.id ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredLocationPages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        page.type === 'state'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {page.type === 'state' ? 'State' : 'City'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewPage(page)}
                      className="text-green-600 hover:text-green-900 flex items-center cursor-pointer p-1"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/location-pages/edit/${page.id}`)}
                      className="text-blue-600 hover:text-blue-900 flex items-center cursor-pointer p-1"
                      title="Edit Page"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="text-red-600 hover:text-red-900 flex items-center cursor-pointer p-1"
                      disabled={isDeleting && deleteId === page.id}
                      title="Delete Page"
                    >
                      {isDeleting && deleteId === page.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{page.title}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">State:</p>
                    <p className="text-gray-900">{page.state}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">City:</p>
                    <p className="text-gray-900">{page.city || '-'}</p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Updated: {new Date(page.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* View Modal */}
      {viewPage && (
        <ViewModal 
          page={viewPage} 
          onClose={() => setViewPage(null)}
          onEdit={(id) => router.push(`/dashboard/location-pages/edit/${id}`)}
        />
      )}
    </div>
  );
}