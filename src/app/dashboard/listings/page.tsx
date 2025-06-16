'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usaStatesAndCitiesData } from '@/lib/demo-data';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import './swiper-styles.css';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  state: string;
  city: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: any;
  updatedAt: any;
  userId: string;
  adType: 'free' | 'premium';
  description: string;
  photos: string[];
  category: string;
  age: string;
  boosted?: boolean;
  promotedAt?: string;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedAd, setSearchedAd] = useState<Listing | null>(null);

  // Get states list
  const statesList = usaStatesAndCitiesData.states.map(state => ({
    name: state.name,
    abbreviation: state.abbreviation
  }));

  // Get cities for selected state
  const citiesList = selectedState 
    ? usaStatesAndCitiesData.states
        .find(state => state.abbreviation === selectedState)
        ?.cities || []
    : [];

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

  // Get state name from abbreviation
  const getStateNameFromAbbreviation = (abbreviation: string): string => {
    const state = usaStatesAndCitiesData.states.find(
      state => state.abbreviation.toLowerCase() === abbreviation.toLowerCase()
    );
    return state ? state.name : abbreviation;
  };

  // Get city name from slug
  const getCityNameFromSlug = (stateAbbr: string, citySlug: string): string => {
    const state = usaStatesAndCitiesData.states.find(
      state => state.abbreviation.toLowerCase() === stateAbbr.toLowerCase()
    );
    if (!state) return citySlug;
    
    const city = state.cities.find(
      city => city.slug.toLowerCase() === citySlug.toLowerCase()
    );
    return city ? city.name : citySlug;
  };

  // Fetch ads based on state and city
  const fetchAds = async () => {
    if (!selectedState) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Convert state abbreviation to full name
      const stateName = getStateNameFromAbbreviation(selectedState);
      let cityName = '';
      
      if (selectedCity) {
        cityName = getCityNameFromSlug(selectedState, selectedCity);
      }
      
      console.log(`Fetching ads for state: ${stateName}${cityName ? `, city: ${cityName}` : ''}`);
      
      let q = query(collection(db, 'ads'));
      
      // Add state filter
      if (stateName) {
        q = query(q, where('state', '==', stateName));
      }
      
      // Add city filter if selected
      if (cityName) {
        q = query(q, where('city', '==', cityName));
      }
      
      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.docs.length} ads`);
      
      const ads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Ad',
          state: data.state || '',
          city: data.city || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          userId: data.userId || '',
          adType: data.adType || 'free',
          description: data.description || '',
          photos: data.photos || [],
          category: data.category || '',
          age: data.age || '',
          boosted: data.boosted,
          promotedAt: data.promotedAt
        } as Listing;
      });
      
      // Sort ads: premium first, then by creation date (newest first)
      ads.sort((a, b) => {
        // Premium ads first
        if (a.adType === 'premium' && b.adType !== 'premium') return -1;
        if (a.adType !== 'premium' && b.adType === 'premium') return 1;
        
        // Then by creation date (newest first)
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt?.seconds * 1000 || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt?.seconds * 1000 || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setListings(ads);
    } catch (err) {
      setError('Failed to fetch ads');
      console.error('Error fetching ads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset city when state changes
  useEffect(() => {
    setSelectedCity('');
  }, [selectedState]);

  // Add ImageCarousel component
  function ImageCarousel({ images, photoCount }: { images: string[], photoCount: number }) {
    const allImages = images.length > 0 ? images : ['/placeholder.svg'];
    
    return (
      <div className="relative listing-image-carousel-fixed">
        <div style={{
          width: '170px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            pagination={{
              clickable: true,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={allImages.length > 1}
            className="h-full w-full"
            style={{ width: '170px', height: '100%' }}
            grabCursor={true}
            simulateTouch={true}
            touchEventsTarget="container"
          >
            {allImages.map((image, index) => (
              <SwiperSlide key={index}>
                <img
                  src={image}
                  alt="Listing image"
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {photoCount}
        </div>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const docRef = doc(db, 'ads', searchQuery);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSearchedAd({
          id: docSnap.id,
          title: data.title || 'Untitled Ad',
          state: data.state || '',
          city: data.city || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          userId: data.userId || '',
          adType: data.adType || 'free',
          description: data.description || '',
          photos: data.photos || [],
          category: data.category || '',
          age: data.age || '',
          boosted: data.boosted,
          promotedAt: data.promotedAt
        });
      } else {
        setSearchedAd(null);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      setSearchedAd(null);
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
        <h1 className="text-2xl font-semibold text-gray-900">Escort Listings Management</h1>
        <button
          onClick={() => router.push('/dashboard/listings/create')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create New Listing
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <form onSubmit={handleSearch}>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search by Ad ID
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Ad ID..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>
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

        {/* State Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="">All States</option>
            {statesList.map((state) => (
              <option key={state.abbreviation} value={state.abbreviation}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedState}
          >
            <option value="">All Cities</option>
            {citiesList.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fetch Ads Button */}
        <div className="flex items-end">
          <button
            onClick={fetchAds}
            disabled={!selectedState || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Fetch Ads'}
          </button>
        </div>
      </div>

      {/* Searched Ad */}
      {searchedAd && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Searched Ad</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-row hover:shadow-md transition-shadow h-[253px] sm:h-[242px] md:h-[242px] relative">
              <ImageCarousel 
                images={searchedAd.photos || []} 
                photoCount={searchedAd.photos?.length || 0}
              />
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-black font-bold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-3 leading-tight">{searchedAd.title}</div>
                  <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-tight sm:leading-normal">{searchedAd.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{searchedAd.city}, {searchedAd.state}</span>
                  <span>{new Date(searchedAd.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          No listings found.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredListings.map((listing) => (
            (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-row hover:shadow-md transition-shadow"
                style={{ minHeight: '170px', height: '170px' }}
              >
                <ImageCarousel
                  images={listing.photos || []}
                  photoCount={listing.photos?.length || 0}
                />
                <div className="flex flex-col justify-between flex-1 p-2 h-full">
                  {/* Top badges and title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-xs line-clamp-2 leading-tight" style={{ maxWidth: '100px' }}>{listing.title}</div>
                      <div className="flex flex-col items-end gap-1 min-w-[50px]">
                        {listing.boosted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 whitespace-nowrap">👑 TOP</span>
                        )}
                        {!listing.boosted && listing.adType === 'premium' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 whitespace-nowrap">Premium</span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-xs mb-1 line-clamp-2 leading-tight" style={{ minHeight: '18px' }}>{listing.description}</p>
                  </div>
                  {/* Location and date */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{listing.city}, {listing.state}</span>
                    <span>{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'Invalid Date'}</span>
                  </div>
                  {/* Buttons */}
                  <div className="flex items-center gap-2 mt-auto">
                    <Link
                      href={`/dashboard/listings/edit/${listing.id}`}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      style={{ minWidth: '50px', justifyContent: 'center' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      style={{ minWidth: '50px', justifyContent: 'center' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
