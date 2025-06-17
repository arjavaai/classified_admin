"use client"
import { AdCreationProvider, useAdCreation } from "./ad-creation-context"
import AdTypeSelection from "./ad-type-selection"
import AdFormStep1 from "./ad-form-step1"
import AdFormStep2 from "./ad-form-step2"
import AdFormStep3 from "./ad-form-step3"
import { ChevronRight } from "lucide-react"
import { useEffect } from "react"

interface CreateAdFormProps {
  initialAd?: any;
  isEditMode?: boolean;
  adId?: string;
  disableForm?: boolean;
}

export default function CreateAdForm({ initialAd, isEditMode = false, adId, disableForm = false }: CreateAdFormProps = {}) {
  return (
    <AdCreationProvider initialAd={initialAd} isEditMode={isEditMode} adId={adId}>
      <AdFormContent disableForm={disableForm} />
    </AdCreationProvider>
  )
}

function AdFormContent({ disableForm }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const { step } = state
  
  // Check if coming from promote-ad page or edit mode
  useEffect(() => {
    if (state.isEditMode) {
      // Skip to step 1 for edit mode
      dispatch({ type: "SET_STEP", payload: 1 })
      return;
    }

    const promotedAdType = typeof window !== 'undefined' ? localStorage.getItem('promotedAdType') : null
    
    if (promotedAdType) {
      // Set the ad type from localStorage
      dispatch({ type: "SET_AD_TYPE", payload: promotedAdType })
      // Skip to step 1
      dispatch({ type: "SET_STEP", payload: 1 })
      // Clear the localStorage item to prevent this from happening on refresh
      localStorage.removeItem('promotedAdType')
    }
    // For admin creation, start from step 0 (ad type selection) - no longer skip
  }, [dispatch, state.isEditMode])

  return (
    <>
      {step === 0 && !state.isEditMode ? (
        <AdTypeSelection />
      ) : (
        <div className="bg-gray-50 min-h-screen">
          {/* Blue Header - Matching Types of Ads header */}
          <header className="bg-[#007bff] text-white py-6 w-full">
            <div className="container mx-auto text-center">
              <h1 className="text-4xl font-bold">{state.isEditMode ? 'Edit Your Ad' : 'Post Your Ad'}</h1>
              <p className="mt-2 text-lg font-medium">Quick and easy in just a few steps</p>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Combined Card with Steps Progress and Form Content */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Steps Progress inside the card */}
              <div className="bg-gray-50 p-6 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-2 md:flex md:justify-between md:items-center md:gap-8 max-w-3xl mx-auto relative">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center justify-center text-center md:flex-row">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold ${
                          step >= 1 ? "bg-[#007bff] text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        1
                      </div>
                      <span className={`mt-2 text-xs font-medium ${step >= 1 ? "text-[#007bff]" : "text-gray-500"} md:hidden max-w-[100px] text-center leading-tight whitespace-nowrap`}>
                      Add information
                      </span>
                    </div>
                    <span className={`ml-0 md:ml-3 text-xs md:text-base font-bold ${step >= 1 ? "text-[#007bff]" : "text-gray-500"} hidden md:block whitespace-nowrap`}>
                      Add information
                    </span>
                  </div>

                  {/* Chevron 1 */}
                  <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-300 hidden md:block" />

                  {/* Step 2 */}
                  <div className="flex flex-col items-center justify-center text-center md:flex-row">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold ${
                          step >= 2 ? "bg-[#007bff] text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        2
                      </div>
                      <span className={`mt-2 text-xs font-medium ${step >= 2 ? "text-[#007bff]" : "text-gray-500"} md:hidden max-w-[100px] text-center leading-tight whitespace-nowrap`}>
                        Add photos
                      </span>
                    </div>
                    <span className={`ml-0 md:ml-3 text-xs md:text-base font-bold ${step >= 2 ? "text-[#007bff]" : "text-gray-500"} hidden md:block whitespace-nowrap`}>
                      Add photos
                    </span>
                  </div>

                  {/* Chevron 2 */}
                  <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-300 hidden md:block" />

                  {/* Step 3 */}
                  <div className="flex flex-col items-center justify-center text-center md:flex-row">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold ${
                          step >= 3 ? "bg-[#007bff] text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        3
                      </div>
                      <span className={`mt-2 text-xs font-medium ${step >= 3 ? "text-[#007bff]" : "text-gray-500"} md:hidden max-w-[100px] text-center leading-tight whitespace-nowrap`}>
                        Finish
                      </span>
                    </div>
                    <span className={`ml-0 md:ml-3 text-xs md:text-base font-bold ${step >= 3 ? "text-[#007bff]" : "text-gray-500"} hidden md:block whitespace-nowrap`}>
                      Finish
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {step === 1 && <AdFormStep1 disableForm={disableForm} />}
                {step === 2 && <AdFormStep2 disableForm={disableForm} />}
                {step === 3 && <AdFormStep3 disableForm={disableForm} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 