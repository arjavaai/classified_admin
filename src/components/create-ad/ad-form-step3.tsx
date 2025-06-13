"use client"

import { useAdCreation } from "./ad-creation-context"
import { useState } from "react"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdFormStep3({ disableForm = false }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const goToPreviousStep = () => {
    dispatch({ type: "SET_STEP", payload: 2 })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleTermsChange = (checked: boolean) => {
    dispatch({ type: "UPDATE_FORM", payload: { termsAccepted: checked } })
  }

  const handleSubmit = async () => {
    if (!state.termsAccepted) {
      setSubmitError("Please agree to the Terms and Conditions before publishing.")
      return
    }

    setSubmitError(null)
    setSubmitSuccess(false)
    setIsSubmitting(true)

    try {
      console.log("=== FIREBASE UPDATE DEBUG START ===")
      console.log("Starting submit process...")
      console.log("Edit mode:", state.isEditMode)
      console.log("Ad ID:", state.adId)
      
      // Test Firebase connection first
      console.log("Testing Firebase connection...")
      console.log("Firebase db object:", db)
      console.log("Firebase app config:", db.app.options)
      
      // Handle edit mode
      if (state.isEditMode && state.adId) {
        console.log("Processing edit mode update...")
        
        // Validate required fields
        if (!state.name || !state.title || !state.description) {
          throw new Error("Missing required fields: name, title, or description")
        }
        
        // For edit mode, update the existing ad
        const updateData = {
          // Personal info
          name: state.name,
          category: state.category,
          age: state.age,
          contactPreference: state.contactPreference,
          email: state.email,
          phone: state.phone,
          whatsapp: state.whatsapp,
          sms: state.sms,
          
          // Location
          state: state.state,
          city: state.city,
          
          // Ad details
          title: state.title,
          description: state.description,
          
          // Characteristics
          ethnicity: state.ethnicity || [],
          nationality: state.nationality || [],
          bodyType: state.bodyType || [],
          breastType: state.breastType || [],
          hairColor: state.hairColor || [],
          services: state.services || [],
          catersTo: state.catersTo || [],
          placeOfService: state.placeOfService || [],
          
          // Rates
          incallRates: state.incallRates || {},
          outcallRates: state.outcallRates || {},
          
          // Photos
          photos: state.photos || [],
          
          // Update timestamp
          updatedAt: new Date().toISOString()
        };

        console.log("Update data prepared:", JSON.stringify(updateData, null, 2));
        console.log("Updating document with ID:", state.adId);

        // Create document reference
        const docRef = doc(db, 'ads', state.adId);
        console.log("Document reference created:", docRef);
        console.log("Document path:", docRef.path);
        
        // Test if we can create the reference without error
        console.log("Document reference is valid:", !!docRef);
        
        // Attempt the update
        console.log("Attempting Firebase updateDoc...");
        const updateResult = await updateDoc(docRef, updateData);
        console.log("Firebase updateDoc completed:", updateResult);
        console.log("Document updated successfully!");
        
        // Show success message
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        console.log("=== FIREBASE UPDATE DEBUG END - SUCCESS ===")
        
        // Redirect back to users page with success message after showing success
        setTimeout(() => {
          router.push('/dashboard/users?status=updated');
        }, 2000);
        return;
      } else {
        console.log("Not in edit mode or missing ad ID");
        console.log("isEditMode:", state.isEditMode);
        console.log("adId:", state.adId);
        throw new Error("Invalid edit mode configuration");
      }
      
    } catch (error: any) {
      console.log("=== FIREBASE UPDATE DEBUG END - ERROR ===")
      console.error("Error in ad submission:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error.constructor.name);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
        name: error.name
      });
      
      // Log the full error object
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMessage = "There was an error processing your request. Please try again.";
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your authentication and try again.";
      } else if (error.code === 'not-found') {
        errorMessage = "The advertisement was not found. It may have been deleted.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Service temporarily unavailable. Please try again in a moment.";
      } else if (error.code === 'unauthenticated') {
        errorMessage = "Authentication required. Please log in and try again.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-8">Terms, Conditions and Privacy Policy</h2>
      
      {/* Success message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Success!</span>
          </div>
          <p className="mb-3">Advertisement updated successfully. Redirecting...</p>
        </div>
      )}
      
      {/* Error message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mb-3">{submitError}</p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="mb-12">
        <div className="flex flex-row items-start gap-4 mb-6">
          <div className="flex items-center gap-2 min-w-[120px] justify-center">
            <div 
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer ${
                state.termsAccepted 
                  ? "bg-blue-600" 
                  : "bg-gray-200 border border-blue-600"
              }`}
              onClick={() => !disableForm && handleTermsChange(!state.termsAccepted)}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform shadow-sm ${
                  state.termsAccepted ? "translate-x-8" : "translate-x-0"
                }`}
              >
                <span className={`text-xs font-medium ${state.termsAccepted ? "text-blue-600" : "text-gray-500"}`}>
                  {state.termsAccepted ? "Yes" : "No"}
                </span>
              </span>
            </div>
          </div>
          <div className="flex-1 mt-1">
            <label htmlFor="terms-switch" className="text-gray-600 text-xs cursor-pointer leading-snug">
              I have read the{" "}
              <a href="/pages/terms-and-conditions" className="text-blue-600 hover:text-blue-800">Terms and Conditions</a>{" "}
              of use and{" "}
              <a href="/pages/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>{" "}
              and I hereby authorize the processing of my personal data for the purpose of providing this web service.
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-3 mt-8">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="bg-gray-800 text-white font-bold rounded px-8 py-6 hover:bg-black border border-gray-700 flex-1 text-lg min-w-[140px]"
          disabled={isSubmitting || disableForm}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-blue-600 text-white font-bold rounded px-8 py-6 hover:bg-blue-700 border border-blue-600 flex-1 text-lg min-w-[140px]"
          disabled={isSubmitting || !state.termsAccepted || disableForm}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {state.isEditMode ? "Updating..." : "Submitting..."}
            </>
          ) : (
            state.isEditMode ? "Update Post" : "Submit"
          )}
        </button>
      </div>
    </div>
  )
} 