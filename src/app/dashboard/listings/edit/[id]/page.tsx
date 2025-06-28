"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import CreateAdForm from '@/components/create-ad/create-ad-form';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ad, setAd] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchAd = async () => {
      try {
        setLoading(true);
        const adDoc = await getDoc(doc(db, "ads", id));
        
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() };
          setAd(adData);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError('Failed to fetch ad. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 text-center">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 text-center text-red-500">Ad not found.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* CreateAdForm with its own layout - matches create-ad flow exactly */}
      <CreateAdForm initialAd={ad} isEditMode adId={id} />
    </div>
  );
}