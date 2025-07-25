'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, query, limit, orderBy, startAfter, DocumentSnapshot, getCountFromServer, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, X, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [allLocationPages, setAllLocationPages] = useState<LocationPage[]>([]); // Store all filtered data
  const [displayedPages, setDisplayedPages] = useState<LocationPage[]>([]); // Current page data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'state' | 'city'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewPage, setViewPage] = useState<LocationPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Available states for filters
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Create base query with database-level filters (not search)
  const createBaseQuery = () => {
    const locationPagesCollection = collection(db, 'locationPages');
    const conditions = [];
    
    // Add type filter
    if (filter !== 'all') {
      conditions.push(where('type', '==', filter));
    }
    
    // Add state filter
    if (stateFilter !== 'all') {
      conditions.push(where('state', '==', stateFilter));
    }
    
    // Create query with conditions and ordering
    if (conditions.length > 0) {
      return query(locationPagesCollection, ...conditions, orderBy('updatedAt', 'desc'));
    } else {
      return query(locationPagesCollection, orderBy('updatedAt', 'desc'));
    }
  };

  // Client-side search function
  const performClientSearch = (pages: LocationPage[], searchTerm: string): LocationPage[] => {
    if (!searchTerm.trim()) {
      return pages;
    }
    
    const search = searchTerm.toLowerCase().trim();
    return pages.filter(page => {
      const stateMatch = page.state.toLowerCase().includes(search);
      const cityMatch = page.city?.toLowerCase().includes(search) || false;
      const titleMatch = page.title.toLowerCase().includes(search);
      const contentMatch = page.content.toLowerCase().includes(search);
      
      return stateMatch || cityMatch || titleMatch || contentMatch;
    });
  };

  // Fetch all filtered data (without search)
  const fetchAllFilteredData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const baseQuery = createBaseQuery();
      const snapshot = await getDocs(baseQuery);
      const pages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LocationPage[];
      
      setAllLocationPages(pages);
      return pages;
      
    } catch (err) {
      console.error('Error fetching location pages:', err);
      setError('Failed to load location pages. Please try again later.');
      setAllLocationPages([]);
      return [];
    }
  };

  // Apply search and pagination to filtered data
  const applySearchAndPagination = (pages: LocationPage[], searchTerm: string, page: number) => {
    // Apply client-side search
    const searchedPages = performClientSearch(pages, searchTerm);
    
    // Update totals
    const total = searchedPages.length;
    setTotalItems(total);
    setTotalPages(Math.ceil(total / itemsPerPage));
    
    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPages = searchedPages.slice(startIndex, endIndex);
    
    setDisplayedPages(paginatedPages);
  };

  // Fetch available states for filter dropdown
  const fetchAvailableStates = async () => {
    try {
      const locationPagesCollection = collection(db, 'locationPages');
      const snapshot = await getDocs(locationPagesCollection);
      const states = Array.from(new Set(snapshot.docs.map(doc => doc.data().state as string))).sort();
      setAvailableStates(states);
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  // Handle filter changes (type and state)
  useEffect(() => {
    const handleFilterChange = async () => {
      setCurrentPage(1);
      const pages = await fetchAllFilteredData();
      applySearchAndPagination(pages, searchTerm, 1);
      setIsLoading(false);
    };
    
    handleFilterChange();
  }, [filter, stateFilter]);

  // Handle search changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      applySearchAndPagination(allLocationPages, searchTerm, 1);
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, allLocationPages]);

  // Handle page changes
  useEffect(() => {
    applySearchAndPagination(allLocationPages, searchTerm, currentPage);
  }, [currentPage]);

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      await fetchAvailableStates();
      const pages = await fetchAllFilteredData();
      applySearchAndPagination(pages, searchTerm, 1);
      setIsLoading(false);
    };
    
    initializeData();
  }, []);

  // Handle page navigation
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageJump = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    }
  };

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
      
      // Refresh data after deletion
      const pages = await fetchAllFilteredData();
      
      // If current page becomes empty after deletion, go to previous page
      const searchedPages = performClientSearch(pages, searchTerm);
      const newTotalPages = Math.ceil(searchedPages.length / itemsPerPage);
      
      let newCurrentPage = currentPage;
      if (currentPage > newTotalPages && newTotalPages > 0) {
        newCurrentPage = newTotalPages;
        setCurrentPage(newCurrentPage);
      }
      
      applySearchAndPagination(pages, searchTerm, newCurrentPage);
      
    } catch (err) {
      console.error('Error deleting location page:', err);
      setError('Failed to delete the page. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Location Pages</h1>
          <p className="text-sm text-gray-600 mt-1">
            Total: {totalItems} pages | Page {currentPage} of {totalPages}
          </p>
        </div>
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
            placeholder="Search by state, city, title, or content..."
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
        <p className="text-xs text-gray-500 mt-1">
          Search works across all fields: state names, city names, titles, and content.
        </p>
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
            {availableStates.map(state => (
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
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading location pages...</p>
        </div>
      ) : displayedPages.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          <p className="text-gray-900">No location pages found.</p>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || filter !== 'all' || stateFilter !== 'all' 
              ? 'No pages match your search criteria. Try adjusting your filters or search term.' 
              : 'Create your first location page by clicking the "Add New Page" button above.'}
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
                {displayedPages.map((page) => (
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
            {displayedPages.map((page) => (
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

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalItems}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageJump(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pageNumber === currentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === totalPages ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
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