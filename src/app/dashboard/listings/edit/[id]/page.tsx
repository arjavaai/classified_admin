"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

const statusOptions = ["active", "pending", "rejected"];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDoc(doc(db, "listings", id))
      .then((snap) => {
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() });
        } else {
          setError("Listing not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch listing.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setListing({ ...listing, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateDoc(doc(db, "listings", id), {
        title: listing.title,
        description: listing.description,
        status: listing.status,
        updatedAt: new Date().toISOString(),
      });
      setSuccess("Listing updated successfully.");
    } catch (err) {
      setError("Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!listing) return null;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            name="title"
            value={listing.title || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={listing.description || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={4}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={listing.status || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
        {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </form>
    </div>
  );
} 