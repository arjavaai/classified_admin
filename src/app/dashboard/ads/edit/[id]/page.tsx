'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertCircle, ArrowLeft, Loader2, TestTube } from 'lucide-react';
import CreateAdForm from '@/components/create-ad/create-ad-form';

interface Ad {
  id: string;
  title: string;
  description: string;
  price?: number;
  status?: string;
  adType?: string;
  [key: string]: any;
}

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const adId = params?.id as string;
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  // Firebase connection test function
  const testFirebaseConnection = async () => {
    try {
      console.log("=== FIREBASE CONNECTION TEST START ===");
      setTestResult('Testing Firebase connection...');
      
      // Test 1: Check if db object exists
      console.log("Test 1: Firebase db object:", db);
      console.log("Test 1: Firebase app config:", db.app.options);
      
      // Test 2: Try to read from ads collection
      console.log("Test 2: Attempting to read from ads collection...");
      const adsRef = collection(db, 'ads');
      const adsQuery = query(adsRef, limit(1));
      const adsSnapshot = await getDocs(adsQuery);
      console.log("Test 2: Ads collection read successful, docs count:", adsSnapshot.size);
      
      // Test 3: Try to read the specific ad document
      if (adId) {
        console.log("Test 3: Attempting to read specific ad document...");
        const adDocRef = doc(db, 'ads', adId);
        const adDocSnap = await getDoc(adDocRef);
        console.log("Test 3: Ad document exists:", adDocSnap.exists());
        if (adDocSnap.exists()) {
          console.log("Test 3: Ad document data:", adDocSnap.data());
        }
      }
      
      setTestResult('✅ Firebase connection test passed! Check console for details.');
      console.log("=== FIREBASE CONNECTION TEST END - SUCCESS ===");
      
    } catch (error: any) {
      console.log("=== FIREBASE CONNECTION TEST END - ERROR ===");
      console.error("Firebase connection test error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setTestResult(`❌ Firebase connection test failed: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!adId) return;
    
    const fetchAd = async () => {
      try {
        setLoading(true);
        console.log("Fetching ad with ID:", adId);
        const adDoc = await getDoc(doc(db, 'ads', adId));
        
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
          console.log("Ad data loaded:", adData);
          setAd(adData);
        } else {
          console.log("Ad document does not exist");
          setError('Advertisement not found');
        }
      } catch (err: any) {
        console.error('Error fetching ad:', err);
        setError('Failed to load advertisement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading advertisement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Advertisement</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            
            {/* Firebase Test Button */}
            <div className="mb-6">
              <button
                onClick={testFirebaseConnection}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 mr-4"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Firebase Connection
              </button>
              {testResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-left">
                  {testResult}
                </div>
              )}
            </div>
            
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header with back button and test button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Advertisement</h1>
              <p className="text-gray-600">Update advertisement details using the same interface as the main app</p>
            </div>
          </div>
          
          {/* Firebase Test Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={testFirebaseConnection}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Firebase
            </button>
          </div>
        </div>
        
        {/* Test Result Display */}
        {testResult && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="p-3 bg-gray-100 rounded-lg text-sm">
              {testResult}
            </div>
          </div>
        )}
      </div>
      
      {/* CreateAdForm with edit mode - matches classified app exactly */}
      <CreateAdForm initialAd={ad} isEditMode adId={adId} />
    </div>
  );
} 