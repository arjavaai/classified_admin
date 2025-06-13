"use client"

import { useAdCreation } from "./ad-creation-context"
import { useState } from "react"
import { AlertCircle, Upload, X } from "lucide-react"

export default function AdFormStep2({ disableForm = false }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    // Convert files to URLs (in a real app, you'd upload to storage)
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        dispatch({ type: "ADD_PHOTO", payload: url })
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removePhoto = (index: number) => {
    dispatch({ type: "REMOVE_PHOTO", payload: index })
  }

  const goToPreviousStep = () => {
    dispatch({ type: "SET_STEP", payload: 1 })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const goToNextStep = () => {
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
          onClick={() => !disableForm && document.getElementById('photo-upload')?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photos</h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your photos here, or click to browse
          </p>
          <p className="text-sm text-gray-400">
            Supports: JPG, PNG, GIF (Max 10 photos)
          </p>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={disableForm}
          />
        </div>

        {/* Photo Preview Grid */}
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
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use high-quality, clear images</li>
            <li>• Ensure good lighting and composition</li>
            <li>• Photos should be relevant to your advertisement</li>
            <li>• Avoid blurry or low-resolution images</li>
          </ul>
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