'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/rich-text-editor';
import { processImage, uploadImageToFirebase } from '@/lib/image-utils';
import { validateImageFile } from '@/lib/mobile-image-utils';
import { useAuth } from '@/contexts/AuthContext';

interface UploadingImage {
  url: string;
  progress: number;
  file?: File;
  error?: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export default function AddBlogPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState<UploadingImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    coverImage: '',
    tags: [] as string[],
    publishDate: new Date().toISOString().split('T')[0],
    published: false
  });

  // Generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

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

  // Add a tag to the list
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove a tag from the list
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file');
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setUploadingImage({ url: tempUrl, progress: 0, file, status: 'uploading' });
    setError('');

    try {
      // Update to processing
      setUploadingImage(prev => prev ? { ...prev, progress: 10, status: 'processing' } : null);

      // Process the image
      const processedImage = await processImage(file, '/assets/skluva_logo.png');
      
      // Update to uploading
      setUploadingImage(prev => prev ? { ...prev, progress: 30, status: 'uploading' } : null);

      // Upload to Firebase
      const userId = user.uid || user.email || 'admin';
      const downloadURL = await uploadImageToFirebase(
        `blog-covers/${userId}`,
        processedImage,
        file.name,
        (progress) => {
          const mappedProgress = 30 + (progress * 0.7);
          setUploadingImage(prev => prev ? {
            ...prev,
            progress: mappedProgress,
            status: progress >= 100 ? 'complete' : 'uploading'
          } : null);
        }
      );

      // Update form data and cleanup
      setFormData(prev => ({ ...prev, coverImage: downloadURL }));
      setTimeout(() => {
        setUploadingImage(null);
        URL.revokeObjectURL(tempUrl);
      }, 1000);
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadingImage(prev => prev ? {
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        status: 'error'
      } : null);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, coverImage: '' }));
    if (uploadingImage) {
      URL.revokeObjectURL(uploadingImage.url);
      setUploadingImage(null);
    }
  };

  // Retry failed upload
  const handleRetryUpload = () => {
    if (uploadingImage?.file && fileInputRef.current) {
      const event = { target: { files: [uploadingImage.file] } } as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(event);
    }
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
      
      const blogPostData = {
        ...formData,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add document to Firestore
      await addDoc(collection(db, 'blogPosts'), blogPostData);
      
      // Redirect to blog posts list
      router.push('/dashboard/blog-posts');
    } catch (err) {
      console.error('Error adding blog post:', err);
      setError('Failed to add blog post. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Blog Post</h1>
        <p className="text-gray-600">Create a new blog post with content and metadata.</p>
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
                /blog/
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
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700">
              Publish Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="publishDate"
              name="publishDate"
              value={formData.publishDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
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
          <label className="block text-sm font-medium text-gray-700">
            Cover Image (optional)
          </label>
          
          {!formData.coverImage && !uploadingImage && (
            <div className="mt-1">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Click to upload cover image</p>
                <p className="text-xs text-gray-500">Supports: JPG, PNG, WebP (Max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          )}

          {uploadingImage && (
            <div className="mt-2">
              <div className="relative">
                <img 
                  src={uploadingImage.url} 
                  alt="Uploading cover" 
                  className="h-32 w-auto rounded-md object-cover"
                />
                
                {uploadingImage.status === 'error' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-md">
                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-xs text-white text-center mb-2">{uploadingImage.error}</p>
                    <button
                      onClick={handleRetryUpload}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Retry
                    </button>
                  </div>
                ) : uploadingImage.status === 'complete' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-80 rounded-md">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                ) : uploadingImage.status === 'processing' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-80 rounded-md">
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                      <p className="text-sm text-white">Processing...</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-md">
                    <div className="w-3/4">
                      <div className="h-2 bg-gray-200 bg-opacity-70 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-300" 
                          style={{ width: `${uploadingImage.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center mt-1 text-white">
                        Uploading {Math.round(uploadingImage.progress)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.coverImage && !uploadingImage && (
            <div className="mt-2 relative inline-block">
              <img 
                src={formData.coverImage} 
                alt="Cover preview" 
                className="h-32 w-auto rounded-md object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tags (optional)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag and press Enter"
              className="block w-full flex-1 rounded-none rounded-l-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Add
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            Publish this post (if unchecked, it will be saved as a draft)
          </label>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/blog-posts')}
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
              'Save Blog Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
