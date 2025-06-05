'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RichTextEditor from '@/components/rich-text-editor';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function EditPagePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Page>({
    id: '',
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: false,
    createdAt: null,
    updatedAt: null
  });

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const docRef = doc(db, 'pages', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const pageData = docSnap.data() as Omit<Page, 'id'>;
          setFormData({
            id: params.id,
            ...pageData
          });
        } else {
          setError('Page not found');
        }
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPage();
  }, [params.id]);

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Update content from rich text editor
  const handleContentChange = (html: string) => {
    setFormData(prev => ({ ...prev, content: html }));
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.slug || !formData.content) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const pageData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        published: formData.published,
        updatedAt: serverTimestamp()
      };
      
      // Update document in Firestore
      await updateDoc(doc(db, 'pages', params.id), pageData);
      
      // Redirect to pages list
      router.push('/dashboard/pages');
    } catch (err) {
      console.error('Error updating page:', err);
      setError('Failed to update page. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Page</h1>
        <p className="text-gray-600">Update the content and metadata of this page.</p>
      </div>
      
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                /
              </span>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              The URL for this page (e.g., "about" will be accessible at /about).
            </p>
          </div>
        </div>
        
        <div>
          <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
            Meta Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="metaTitle"
            name="metaTitle"
            value={formData.metaTitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Title that appears in search engine results (50-60 characters recommended).
          </p>
        </div>
        
        <div>
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
            Meta Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            value={formData.metaDescription}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">
            Description that appears in search engine results (150-160 characters recommended).
          </p>
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 rounded-md border border-gray-300 shadow-sm">
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
            Publish this page (if unchecked, it will be saved as a draft)
          </label>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pages')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                Saving...
              </span>
            ) : (
              'Update Page'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
