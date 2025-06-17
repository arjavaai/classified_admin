"use client"

import { useState } from "react"
import { useAdCreation } from "./ad-creation-context"
import { Crown, Check, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { isSuperAdminUser } from "@/lib/utils"

export default function AdTypeSelection() {
  const { dispatch } = useAdCreation()
  const { user } = useAuth()
  const [selectedAdType, setSelectedAdType] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  const isAdmin = isSuperAdminUser(user)

  const handleAdTypeSelection = (adType: string) => {
    // Toggle selection: if already selected, deselect it; otherwise select it
    setSelectedAdType(selectedAdType === adType ? null : adType)
    setShowError(false)
  }

  const handleNext = () => {
    if (!selectedAdType) {
      setShowError(true)
      return
    }
    
    dispatch({ type: "SET_AD_TYPE", payload: selectedAdType })
    dispatch({ type: "SET_STEP", payload: 1 })
    // Scroll to the top of the page with a slight delay to ensure content is rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-[#007bff] text-white py-6 w-full">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Admin: Select Ad Type</h1>
          <p className="mt-2 text-lg">Choose the type of ad to create</p>
        </div>
      </header>

      {/* Ad Types Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              <span className="font-medium">Super Admin Mode</span>
            </div>
            <p className="mt-1 text-sm">As an admin, you can create both free and premium ads without payment processing.</p>
          </div>
        )}
        
        <div className="flex flex-col gap-6 mb-8">
          {/* Free Ad Card */}
          <div 
            className={`bg-white rounded-xl shadow-sm border ${selectedAdType === 'free' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md`}
            onClick={() => handleAdTypeSelection('free')}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-gray-700 font-semibold">Free Ad</h2>
                {selectedAdType === 'free' && (
                  <div className="bg-[#007bff] text-white p-2 rounded-full">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-4">Perfect for getting noticed fast with no cost</p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Up to 10 images included</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Active for 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Basic listing features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Contact information display</span>
                </li>
              </ul>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600">FREE</span>
                  <span className="ml-2 text-green-600 font-medium">No payment required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Ad Card */}
          <div 
            className={`bg-white rounded-xl shadow-sm border ${selectedAdType === 'premium' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md relative`}
            onClick={() => handleAdTypeSelection('premium')}
          >
            {/* Premium Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              PREMIUM
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-gray-700 font-semibold">Premium Ad</h2>
                {selectedAdType === 'premium' && (
                  <div className="bg-[#007bff] text-white p-2 rounded-full">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-4">Maximum visibility and premium features</p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Up to 10 images included</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Active for 30 days</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Priority placement in search results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Featured in premium section</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Enhanced visibility</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Premium badge display</span>
                </li>
              </ul>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">$10</span>
                    <span className="ml-2 text-blue-600 font-medium">30 days</span>
                  </div>
                  {isAdmin && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      Admin: No Payment Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {showError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Please select an ad type to continue</span>
            </div>
          </div>
        )}

        {/* Next Button */}
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="bg-[#007bff] text-white font-bold rounded-lg px-8 py-4 hover:bg-blue-700 transition-colors text-lg min-w-[200px]"
            disabled={!selectedAdType}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
} 