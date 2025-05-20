'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RichTextEditor from '@/components/rich-text-editor';
import { usaStatesAndCitiesData } from '@/lib/demo-data';

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

export default function AddLocationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  // These state variables are used in the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [states, setStates] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cities, setCities] = useState<{[state: string]: string[]}>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationPageFormValues>({
    resolver: zodResolver(locationPageSchema),
    defaultValues: {
      type: 'state',
      state: '',
      city: '',
      title: '',
      metaDescription: '',
      h1Title: '',
      content: '',
    },
  });

  const pageType = watch('type');
  const selectedState = watch('state');
  const selectedCity = watch('city');

  // Load states and cities from demo-data.ts
  useEffect(() => {
    try {
      // Extract state names from usaStatesAndCitiesData
      const stateNames = usaStatesAndCitiesData.states.map(state => state.name);
      setStates(stateNames);
      
      // Create a mapping of state names to city names
      const citiesMap: {[state: string]: string[]} = {};
      
      usaStatesAndCitiesData.states.forEach(state => {
        citiesMap[state.name] = state.cities.map(city => city.name);
      });
      
      setCities(citiesMap);
      
      console.log('Loaded states and cities from demo-data.ts');
    } catch (err) {
      console.error('Error loading states and cities:', err);
      setError('Failed to load states and cities. Please try again later.');
    }
  }, []);

  // Function to generate content with AI
  const generateWithAI = async () => {
    try {
      setIsGenerating(true);
      setError('');

      // Validate that required fields are selected
      if (!selectedState) {
        setError('Please select a state');
        setIsGenerating(false);
        return;
      }

      if (pageType === 'city' && !selectedCity) {
        setError('Please select a city');
        setIsGenerating(false);
        return;
      }

      // Prepare request data
      const requestData = {
        type: pageType,
        state: selectedState,
        city: pageType === 'city' ? selectedCity : undefined
      };

      // Call the API
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();

      // Update form fields with generated content
      setValue('title', data.metaTitle);
      setValue('metaDescription', data.metaDescription);
      setValue('h1Title', data.h1Title);
      setValue('content', data.content);

      // Show success message
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: LocationPageFormValues) => {
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

      // Create the location page document
      const locationPageData = {
        type: data.type,
        state: data.state,
        stateSlug,
        city: data.type === 'city' ? data.city : null,
        citySlug: data.type === 'city' ? citySlug : null,
        title: data.title,
        metaDescription: data.metaDescription,
        h1Title: data.h1Title || `${data.state}${data.city ? ` ${data.city}` : ''} Escorts`,
        content: data.content,
        url: data.type === 'state' 
          ? `/us/escorts/${stateSlug}` 
          : `/us/escorts/${stateSlug}/${citySlug}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the document to Firestore
      await addDoc(collection(db, 'locationPages'), locationPageData);

      // Redirect to the location pages list
      router.push('/dashboard/location-pages');
    } catch (err) {
      console.error('Error creating location page:', err);
      setError('Failed to create location page. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add Location Page</h1>
        <p className="text-gray-500">Create a new state or city page with custom content and SEO settings</p>
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
                <option value="" disabled>Select a state</option>
                {usaStatesAndCitiesData.states.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
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
                  disabled={!selectedState}
                >
                  <option value="">Select a city</option>
                  {selectedState ? 
                    usaStatesAndCitiesData.states
                      .find(state => state.name === selectedState)?.cities
                      .map(city => (
                        <option key={city.slug} value={city.name}>{city.name}</option>
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
          
          {/* Generate with AI button */}
          {(selectedState && (pageType === 'state' || (pageType === 'city' && selectedCity))) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={generateWithAI}
                disabled={isGenerating}
                className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </>
                )}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Generate SEO-optimized content for this {pageType} page using AI
              </p>
            </div>
          )}
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
            {isSubmitting ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
