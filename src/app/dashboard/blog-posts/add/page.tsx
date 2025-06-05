'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X } from 'lucide-react';
import RichTextEditor from '@/components/rich-text-editor';

export default function AddBlogPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
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
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
            Cover Image URL (optional)
          </label>
          <input
            type="text"
            id="coverImage"
            name="coverImage"
            value={formData.coverImage}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {formData.coverImage && (
            <div className="mt-2">
              <img 
                src={formData.coverImage} 
                alt="Cover preview" 
                className="h-32 w-auto rounded-md object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                }}
              />
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
