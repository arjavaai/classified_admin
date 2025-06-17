"use client"

import { useAdCreation } from "./ad-creation-context"
import { useRef, useState, useEffect } from "react"
import { Trash2, Upload, CheckCircle, AlertCircle, Info, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { validateImageSize, processImage, uploadImageToFirebase } from "@/lib/image-utils"
import { storage } from "@/lib/firebase"

export default function AdFormStep2({ disableForm = false }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState<{ url: string; progress: number; file?: File; error?: string }[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [watermarkLoaded, setWatermarkLoaded] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

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

  // Check if watermark image exists when component mounts
  useEffect(() => {
    const watermarkImg = new Image();
    watermarkImg.onload = () => setWatermarkLoaded(true);
    watermarkImg.onerror = () => {
      console.error("Watermark image not found");
      setErrorMessage("Watermark image not found. Please contact support.");
    };
    watermarkImg.src = "/assets/skluva_logo.png";
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
    
    // Process each file
    for (const file of filesToProcess) {
      // Validate file size (2MB limit)
      const sizeValidation = validateImageSize(file);
      if (!sizeValidation.valid) {
        const tempUrl = URL.createObjectURL(file);
        setUploadingPhotos((prev) => [
          ...prev, 
          { url: tempUrl, progress: 0, file, error: sizeValidation.error }
        ]);
        continue;
      }
      
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setUploadingPhotos((prev) => [...prev, { url: tempUrl, progress: 0, file }]);
      
      try {
        // Process the image (add watermark, adjust opacity)
        const processedImage = await processImage(file, '/assets/skluva_logo.png');
        
        // Upload to Firebase if user is logged in
        if (user) {
          // Use user email or uid for folder structure
          const userId = user.uid || user.email || 'admin';
          
          // Upload the processed image to Firebase Storage
          uploadImageToFirebase(
            userId,
            processedImage,
            file.name,
            (progress) => {
              setUploadingPhotos((prev) =>
                prev.map((item) =>
                  item.url === tempUrl ? { ...item, progress } : item
                )
              );
            }
          ).then(downloadURL => {
            // Add the download URL to the form state
            dispatch({ type: "ADD_PHOTO", payload: downloadURL });
            // Remove from uploading list
            setUploadingPhotos((prev) => prev.filter((item) => item.url !== tempUrl));
            URL.revokeObjectURL(tempUrl);
          }).catch(error => {
            console.error("Upload error:", error);
            setUploadingPhotos((prev) =>
              prev.map((item) =>
                item.url === tempUrl ? { ...item, error: "Upload failed. Please try again." } : item
              )
            );
          });
        }
      } catch (error) {
        console.error("Image processing error:", error);
        setUploadingPhotos((prev) =>
          prev.map((item) =>
            item.url === tempUrl ? { ...item, error: "Processing failed. Please try again." } : item
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
    
    // Check if images are still uploading
    if (uploadingPhotos.length > 0) {
      const hasUploadingImages = uploadingPhotos.some(photo => !photo.error && photo.progress < 100)
      if (hasUploadingImages) {
        setValidationMessage("Please wait for all images to finish uploading before proceeding")
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
            Supports: JPG, PNG, GIF (Max 10 photos, 2MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={disableForm}
          />
        </div>

        {/* Uploading Photos */}
        {uploadingPhotos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploading Photos ({uploadingPhotos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadingPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Uploading ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  
                  {/* Progress Overlay */}
                  {!photo.error && photo.progress < 100 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-sm font-medium">{Math.round(photo.progress)}%</div>
                        <div className="w-16 bg-gray-300 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${photo.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Overlay */}
                  {!photo.error && photo.progress === 100 && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-75 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                  
                  {/* Error Overlay */}
                  {photo.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center p-2">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-xs">{photo.error}</div>
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
                <li>• Use high-quality, clear images (max 2MB each)</li>
                <li>• Ensure good lighting and composition</li>
                <li>• Photos will be watermarked automatically</li>
                <li>• Images are uploaded to secure cloud storage</li>
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
            disabled={disableForm}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
} 