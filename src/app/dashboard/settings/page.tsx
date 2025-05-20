'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().min(1, 'Site description is required'),
  contactEmail: z.string().email('Invalid email address'),
  listingsPerPage: z.coerce.number().int().positive(),
  requireApproval: z.boolean(),
  allowUserRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  // URL structure settings based on the memory
  useStateUrlFormat: z.boolean().default(true),
  statePagesPrefix: z.string().min(1, 'State pages prefix is required'),
  cityPagesPrefix: z.string().min(1, 'City pages prefix is required'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: 'Classified',
      siteDescription: 'Escort Directory',
      contactEmail: 'admin@example.com',
      listingsPerPage: 20,
      requireApproval: true,
      allowUserRegistration: true,
      maintenanceMode: false,
      maintenanceMessage: 'Site is currently under maintenance. Please check back later.',
      useStateUrlFormat: true,
      statePagesPrefix: '/us/escorts',
      cityPagesPrefix: '/us/escorts',
    },
  });

  const maintenanceMode = watch('maintenanceMode');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          reset({
            ...settingsData,
            listingsPerPage: settingsData.listingsPerPage.toString(),
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      
      await setDoc(doc(db, 'settings', 'general'), {
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      });
      
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setIsSaving(false);
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
        <h1 className="text-2xl font-semibold text-gray-900">Site Settings</h1>
        <p className="text-gray-500">Configure global settings for the classified site</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-500">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">General Settings</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <input
                  id="siteName"
                  type="text"
                  {...register('siteName')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.siteName && (
                  <p className="mt-1 text-sm text-red-500">{errors.siteName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.contactEmail.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                  Site Description
                </label>
                <textarea
                  id="siteDescription"
                  rows={3}
                  {...register('siteDescription')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.siteDescription && (
                  <p className="mt-1 text-sm text-red-500">{errors.siteDescription.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">URL Structure Settings</h2>
            <p className="mb-4 text-sm text-gray-500">
              Configure URL structure for state and city pages
            </p>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('useStateUrlFormat')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use state-based URL format (e.g., /us/escorts/california)
                </span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="statePagesPrefix" className="block text-sm font-medium text-gray-700">
                  State Pages Prefix
                </label>
                <input
                  id="statePagesPrefix"
                  type="text"
                  {...register('statePagesPrefix')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Example: /us/escorts/[state]
                </p>
                {errors.statePagesPrefix && (
                  <p className="mt-1 text-sm text-red-500">{errors.statePagesPrefix.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="cityPagesPrefix" className="block text-sm font-medium text-gray-700">
                  City Pages Prefix
                </label>
                <input
                  id="cityPagesPrefix"
                  type="text"
                  {...register('cityPagesPrefix')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Example: /us/escorts/[state]/[city]
                </p>
                {errors.cityPagesPrefix && (
                  <p className="mt-1 text-sm text-red-500">{errors.cityPagesPrefix.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Listing Settings</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="listingsPerPage" className="block text-sm font-medium text-gray-700">
                  Listings Per Page
                </label>
                <input
                  id="listingsPerPage"
                  type="number"
                  min="1"
                  max="100"
                  {...register('listingsPerPage')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.listingsPerPage && (
                  <p className="mt-1 text-sm text-red-500">{errors.listingsPerPage.message}</p>
                )}
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('requireApproval')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Require admin approval for new listings
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">User Settings</h2>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('allowUserRegistration')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow new user registrations
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Maintenance Settings</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('maintenanceMode')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable maintenance mode
                </span>
              </label>
            </div>
            
            {maintenanceMode && (
              <div>
                <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700">
                  Maintenance Message
                </label>
                <textarea
                  id="maintenanceMessage"
                  rows={3}
                  {...register('maintenanceMessage')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.maintenanceMessage && (
                  <p className="mt-1 text-sm text-red-500">{errors.maintenanceMessage.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
