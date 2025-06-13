"use client"

import { useAdCreation } from "./ad-creation-context"

export default function AdTypeSelection() {
  const { dispatch } = useAdCreation()

  const handleAdTypeSelect = (adType: string) => {
    dispatch({ type: "SET_AD_TYPE", payload: adType })
    dispatch({ type: "SET_STEP", payload: 1 })
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-[#007bff] text-white py-6 w-full">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Select Ad Type</h1>
          <p className="mt-2 text-lg font-medium">Choose the type of advertisement</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => handleAdTypeSelect('free')}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-8 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Ad</h3>
            <p className="text-gray-600 mb-4">Basic advertisement with standard features</p>
            <div className="text-3xl font-bold text-green-600">Free</div>
          </div>

          <div 
            onClick={() => handleAdTypeSelect('premium')}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-8 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Ad</h3>
            <p className="text-gray-600 mb-4">Enhanced advertisement with premium features</p>
            <div className="text-3xl font-bold text-blue-600">$12.95</div>
          </div>
        </div>
      </div>
    </div>
  )
} 