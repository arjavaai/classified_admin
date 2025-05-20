'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RichTextEditor from '@/components/rich-text-editor';

const locationPageSchema = z.object({
  type: z.enum(['state', 'city']),
  state: z.string().min(1, 'State is required'),
  city: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  metaDescription: z.string().min(1, 'Meta description is required')
    .max(160, 'Meta description should be at most 160 characters'),
  h1Title: z.string().min(1, 'H1 title is required'),
  content: z.string().min(1, 'Content is required'),
});

type LocationPageFormValues = z.infer<typeof locationPageSchema>;

interface LocationPage extends LocationPageFormValues {
  id: string;
  stateSlug: string;
  citySlug?: string;
  url: string;
  h1Title: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: { id: string };
}

export default function EditLocationPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationPage, setLocationPage] = useState<LocationPage | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<{[state: string]: string[]}>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<LocationPageFormValues>({
    resolver: zodResolver(locationPageSchema),
    defaultValues: {
      type: 'state',
      state: '',
      city: '',
      title: '',
      metaDescription: '',
      content: '',
    },
  });

  const pageType = watch('type');
  const selectedState = watch('state');

  // Fetch location page data
  useEffect(() => {
    const fetchLocationPage = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'locationPages', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<LocationPage, 'id'>;
          const locationPageData = {
            id: docSnap.id,
            ...data,
          };
          
          setLocationPage(locationPageData);
          
          // Set form values
          reset({
            type: data.type,
            state: data.state,
            city: data.city || '',
            title: data.title,
            metaDescription: data.metaDescription,
            h1Title: data.h1Title || `${data.state}${data.city ? ` ${data.city}` : ''} Escorts`,
            content: data.content,
          });
        } else {
          setError('Location page not found');
          router.push('/dashboard/location-pages');
        }
      } catch (err) {
        console.error('Error fetching location page:', err);
        setError('Failed to load location page. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationPage();
  }, [id, reset, router]);

  // Fetch states and cities for dropdowns
  useEffect(() => {
    const fetchStatesAndCities = async () => {
      try {
        // This is a placeholder - in a real app, you would fetch states and cities from your database
        // For now, we'll use a hardcoded list of US states
        const usStates = [
          'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
          'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
          'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
          'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
          'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
          'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
          'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
          'Wisconsin', 'Wyoming'
        ];
        
        setStates(usStates);
        
        // Placeholder for cities - in a real app, you would fetch cities based on the selected state
        const citiesData: {[state: string]: string[]} = {
          'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
          'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
          'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio'],
          // Add more states and cities as needed
        };
        
        setCities(citiesData);
      } catch (err) {
        console.error('Error fetching states and cities:', err);
        setError('Failed to load states and cities. Please try again later.');
      }
    };

    fetchStatesAndCities();
  }, []);

  const onSubmit = async (data: LocationPageFormValues) => {
    if (!locationPage) return;
    
    try {
      setIsSubmitting(true);
      setError('');

      // Validate that city is provided if type is 'city'
      if (data.type === 'city' && (!data.city || data.city.trim() === '')) {
        setError('City is required for city pages');
        setIsSubmitting(false);
        return;
      }

      // Create a URL-friendly slug for the state and city
      const stateSlug = data.state.toLowerCase().replace(/\s+/g, '-');
      const citySlug = data.city ? data.city.toLowerCase().replace(/\s+/g, '-') : '';

      // Update the location page document
      const locationPageData = {
        type: data.type,
        state: data.state,
        stateSlug,
        city: data.type === 'city' ? data.city : null,
        citySlug: data.type === 'city' ? citySlug : null,
        title: data.title,
        metaDescription: data.metaDescription,
        h1Title: data.h1Title,
        content: data.content,
        url: data.type === 'state' 
          ? `/us/escorts/${stateSlug}` 
          : `/us/escorts/${stateSlug}/${citySlug}`,
        updatedAt: new Date().toISOString(),
      };

      // Update the document in Firestore
      await updateDoc(doc(db, 'locationPages', id), locationPageData);

      // Redirect to the location pages list
      router.push('/dashboard/location-pages');
    } catch (err) {
      console.error('Error updating location page:', err);
      setError('Failed to update location page. Please try again later.');
    } finally {
      setIsSubmitting(false);
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Location Page</h1>
        <p className="text-gray-500">Update content and SEO settings for this location page</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-md bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Page Type & Location</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Page Type
            </label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register('type')}
                  value="state"
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">State Page</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register('type')}
                  value="city"
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">City Page</span>
              </label>
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                id="state"
                {...register('state')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select a state</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>
              )}
            </div>
            
            {pageType === 'city' && (
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  id="city"
                  {...register('city')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  disabled={!selectedState || !cities[selectedState]}
                >
                  <option value="">Select a city</option>
                  {selectedState && cities[selectedState] ? 
                    cities[selectedState].map(city => (
                      <option key={city} value={city}>{city}</option>
                    )) : 
                    <option value="" disabled>Select a state first</option>
                  }
                </select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">SEO Settings</h2>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Page Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Escorts in California | Find Local Escorts"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              rows={3}
              {...register('metaDescription')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Brief description of the page for search engines (max 160 characters)"
            />
            {errors.metaDescription && (
              <p className="mt-1 text-sm text-red-500">{errors.metaDescription.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {watch('metaDescription')?.length || 0}/160 characters
            </p>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Page Content</h2>
          
          <div className="mb-4">
            <label htmlFor="h1Title" className="block text-sm font-medium text-gray-700">
              H1 Title (Main Heading)
            </label>
            <input
              id="h1Title"
              type="text"
              {...register('h1Title')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Los Angeles Escorts"
            />
            {errors.h1Title && (
              <p className="mt-1 text-sm text-red-500">{errors.h1Title.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will be displayed as the main heading (H1) on the page
            </p>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/location-pages')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
