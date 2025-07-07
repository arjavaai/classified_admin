"use client"

import { useAdCreation } from "./ad-creation-context"
import { useRef, useState, useEffect } from "react"
import { Trash2, Upload, CheckCircle, AlertCircle, Info, X, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { processImage, uploadImageToFirebase } from "@/lib/image-utils"
import { validateImageFile, isMobileDevice, triggerImageCapture } from "@/lib/mobile-image-utils"

interface UploadingPhoto {
  url: string;
  progress: number;
  file?: File;
  error?: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export default function AdFormStep2({ disableForm = false }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Check if user is on mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Clear validation message when all images finish uploading
  useEffect(() => {
    if (validationMessage && uploadingPhotos.length === 0 && state.photos.length > 0) {
      setValidationMessage(null)
    }
  }, [uploadingPhotos.length, validationMessage, state.photos.length])

  const handleFiles = async (files: File[]) => {
    if (!user) {
      setErrorMessage("Please log in to upload photos.");
      return;
    }
    
    setErrorMessage(null);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const remainingSlots = 10 - state.photos.length - uploadingPhotos.length;
    const filesToProcess = imageFiles.slice(0, remainingSlots);
    
    if (filesToProcess.length === 0) {
      if (imageFiles.length > 0 && remainingSlots === 0) {
        setErrorMessage("Maximum number of photos (10) reached");
      }
      return;
    }
    
    // Process each file with server-side upload
    for (const file of filesToProcess) {
      // Validate file with new validation function
      const validation = validateImageFile(file);
      if (!validation.valid) {
        const tempUrl = URL.createObjectURL(file);
        setUploadingPhotos((prev) => [
          ...prev, 
          { url: tempUrl, progress: 0, file, error: validation.error, status: 'error' }
        ]);
        continue;
      }
      
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setUploadingPhotos((prev) => [...prev, { 
        url: tempUrl, 
        progress: 0, 
        file, 
        status: 'uploading' 
      }]);
      
      try {
        console.log('Processing image:', file.name);
        
        // Update status to processing
        setUploadingPhotos((prev) =>
          prev.map((item) =>
            item.url === tempUrl ? { ...item, progress: 10, status: 'processing' } : item
          )
        );

        // Process the image (add watermark, adjust opacity)
        const processedImage = await processImage(file, '/assets/skluva_logo.png');
        
        // Update progress after processing
        setUploadingPhotos((prev) =>
          prev.map((item) =>
            item.url === tempUrl ? { ...item, progress: 30, status: 'uploading' } : item
          )
        );

        // Upload to Firebase
        const userId = user.uid || user.email || 'admin';
        const downloadURL = await uploadImageToFirebase(
          userId,
          processedImage,
          file.name,
          (progress) => {
            // Map Firebase progress (0-100) to our range (30-100)
            const mappedProgress = 30 + (progress * 0.7);
            setUploadingPhotos((prev) =>
              prev.map((item) =>
                item.url === tempUrl ? { 
                  ...item, 
                  progress: mappedProgress,
                  status: progress >= 100 ? 'complete' : 'uploading'
                } : item
              )
            );
          }
        );

        // Mark as complete
        setUploadingPhotos((prev) =>
          prev.map((item) =>
            item.url === tempUrl ? { ...item, progress: 100, status: 'complete' } : item
          )
        );

        // Add a small delay to show completion state
        setTimeout(() => {
          // Add the download URL to the form state
          dispatch({ type: "ADD_PHOTO", payload: downloadURL });
          // Remove from uploading list
          setUploadingPhotos((prev) => prev.filter((item) => item.url !== tempUrl));
          URL.revokeObjectURL(tempUrl);
        }, 500);

        console.log('Image uploaded successfully:', downloadURL);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadingPhotos((prev) =>
          prev.map((item) =>
            item.url === tempUrl ? { 
              ...item, 
              error: error instanceof Error ? error.message : "Upload failed. Please try again.",
              status: 'error'
            } : item
          )
        );
      }
    }
  }

  const removePhoto = (index: number) => {
    dispatch({ type: "REMOVE_PHOTO", payload: index })
  }

  const removeUploadingPhoto = (url: string) => {
    setUploadingPhotos((prev) => prev.filter((item) => item.url !== url));
    URL.revokeObjectURL(url);
  }

  const retryFailedUpload = async (failedPhoto: UploadingPhoto) => {
    if (!user || !failedPhoto.file) return;
    
    // Remove the failed upload from the list
    setUploadingPhotos((prev) => prev.filter((photo) => photo.url !== failedPhoto.url));
    
    // Create new temporary URL
    const tempUrl = URL.createObjectURL(failedPhoto.file);
    setUploadingPhotos((prev) => [...prev, { 
      url: tempUrl, 
      progress: 0, 
      file: failedPhoto.file!, 
      status: 'uploading' 
    }]);
    
    try {
      console.log('Retrying upload for:', failedPhoto.file.name);
      
      // Update status to processing
      setUploadingPhotos((prev) =>
        prev.map((item) =>
          item.url === tempUrl ? { ...item, progress: 10, status: 'processing' } : item
        )
      );

      // Process the image (add watermark, adjust opacity)
      const processedImage = await processImage(failedPhoto.file, '/assets/skluva_logo.png');
      
      // Update progress after processing
      setUploadingPhotos((prev) =>
        prev.map((item) =>
          item.url === tempUrl ? { ...item, progress: 30, status: 'uploading' } : item
        )
      );

      // Upload to Firebase
      const userId = user.uid || user.email || 'admin';
      const downloadURL = await uploadImageToFirebase(
        userId,
        processedImage,
        failedPhoto.file.name,
        (progress) => {
          // Map Firebase progress (0-100) to our range (30-100)
          const mappedProgress = 30 + (progress * 0.7);
          setUploadingPhotos((prev) =>
            prev.map((item) =>
              item.url === tempUrl ? { 
                ...item, 
                progress: mappedProgress,
                status: progress >= 100 ? 'complete' : 'uploading'
              } : item
            )
          );
        }
      );

      // Mark as complete
      setUploadingPhotos((prev) =>
        prev.map((item) =>
          item.url === tempUrl ? { ...item, progress: 100, status: 'complete' } : item
        )
      );

      setTimeout(() => {
        dispatch({ type: "ADD_PHOTO", payload: downloadURL });
        setUploadingPhotos((prev) => prev.filter((item) => item.url !== tempUrl));
        URL.revokeObjectURL(tempUrl);
      }, 500);

      console.log('Retry upload successful:', downloadURL);
    } catch (error) {
      console.error("Retry upload error:", error);
      setUploadingPhotos((prev) =>
        prev.map((item) =>
          item.url === tempUrl ? { 
            ...item, 
            error: error instanceof Error ? error.message : "Retry failed. Please try again.",
            status: 'error'
          } : item
        )
      );
    }
    
    // Clean up the original failed URL
    URL.revokeObjectURL(failedPhoto.url);
  }

  const goToPreviousStep = () => {
    dispatch({ type: "SET_STEP", payload: 1 })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const goToNextStep = () => {
    // Clear any previous validation message
    setValidationMessage(null)
    
    // Check if no images have been uploaded
    if (state.photos.length === 0 && uploadingPhotos.length === 0) {
      setValidationMessage("Please upload at least one image")
      return
    }
    
    // Check if any uploads are still in progress
    if (uploadingPhotos.length > 0) {
      const hasActiveUploads = uploadingPhotos.some(photo => 
        photo.status === 'uploading' || photo.status === 'processing'
      )
      if (hasActiveUploads) {
        setValidationMessage("Please wait for all images to finish uploading before proceeding")
        return
      }
      
      // Check if any uploads failed
      const hasFailedUploads = uploadingPhotos.some(photo => photo.status === 'error')
      if (hasFailedUploads) {
        setValidationMessage("Some images failed to upload. Please remove failed uploads or try again")
        return
      }
    }

    dispatch({ type: "SET_STEP", payload: 3 })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Photos</h2>
          <p className="text-gray-600 mb-6">Upload up to 10 photos to showcase your advertisement</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Validation Message */}
        {validationMessage && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">{validationMessage}</span>
            </div>
          </div>
        )}

        {/* Photo Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          } ${disableForm ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disableForm && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photos</h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your photos here, or click to browse
          </p>
          <p className="text-sm text-gray-400">
            Supports: JPG, PNG, WebP, HEIC (Max 10 photos, 10MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            capture={isMobile ? "environment" : undefined}
            className="hidden"
            onChange={handleFileChange}
            disabled={disableForm}
          />
        </div>

        {/* Mobile-aware upload buttons */}
        <div className="flex gap-2 justify-center flex-wrap mb-6">
          <button
            type="button"
            onClick={() => triggerImageCapture(fileInputRef, false)}
            disabled={disableForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isMobile ? "Select from Gallery" : "Select Images"}
          </button>
          {isMobile && (
            <button
              type="button"
              onClick={() => triggerImageCapture(fileInputRef, true)}
              disabled={disableForm}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md inline-flex items-center disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Take Photo
            </button>
          )}
        </div>

        {/* Uploading Photos */}
        {uploadingPhotos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploading Photos ({uploadingPhotos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadingPhotos.map((photo, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative group">
                    <img
                      src={photo.url}
                      alt={`Uploading ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    
                    {photo.status === 'error' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 p-2 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
                        <div className="text-xs text-center text-white font-medium mb-2">{photo.error}</div>
                        <button
                          onClick={() => retryFailedUpload(photo)}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Retry
                        </button>
                      </div>
                    ) : photo.status === 'complete' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-80 rounded-lg">
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-12 h-12 text-white mb-2" />
                          <div className="text-sm text-white font-medium">Complete!</div>
                        </div>
                      </div>
                    ) : photo.status === 'processing' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-80 rounded-lg">
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                          <div className="text-sm text-white font-medium">Processing...</div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                        <div className="w-3/4">
                          <div className="h-3 bg-gray-200 bg-opacity-70 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-300" 
                              style={{ width: `${photo.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-center mt-1 text-white font-medium">
                            Uploading {photo.progress}%
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeUploadingPhoto(photo.url)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 text-center">
                    {photo.status === 'error' ? 'Failed' : 
                     photo.status === 'complete' ? 'Complete' : 
                     photo.status === 'processing' ? 'Processing' : 
                     `Uploading ${photo.progress}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Photos */}
        {state.photos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Photos ({state.photos.length}/10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  {!disableForm && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-quality, clear images (max 10MB each)</li>
                <li>• Ensure good lighting and composition</li>
                <li>• Photos will be watermarked and converted to WebP automatically</li>
                <li>• Images are uploaded to secure cloud storage</li>
                <li>• Supports JPEG, PNG, WebP, and HEIC formats</li>
                <li>• Avoid blurry or low-resolution images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3 mt-8">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="bg-gray-800 text-white font-bold rounded px-8 py-6 hover:bg-black border border-gray-700 flex-1 text-lg min-w-[140px]"
            disabled={disableForm}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white font-bold rounded px-8 py-6 hover:bg-blue-700 border border-blue-600 flex-1 text-lg min-w-[140px]"
            disabled={disableForm || uploadingPhotos.some(photo => 
              photo.status === 'uploading' || photo.status === 'processing'
            ) || uploadingPhotos.some(photo => photo.status === 'error')}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
} 