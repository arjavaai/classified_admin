"use client"

import React from "react"
import { createContext, useContext, useReducer } from "react"

// Define types for our state
export type AdFormData = {
  step: number
  adType: string | null
  name: string
  category: string
  age: string
  contactPreference: "email" | "phone" | "both"
  email: string
  phone: string
  whatsapp: boolean
  sms: boolean
  state: string
  city: string
  title: string
  description: string
  ethnicity: string[]
  nationality: string[]
  bodyType: string[]
  breastType: string[]
  hairColor: string[]
  services: string[]
  catersTo: string[]
  placeOfService: string[]
  incallRates: Record<string, string>
  outcallRates: Record<string, string>
  photos: string[]
  termsAccepted: boolean
  // Edit mode fields
  isEditMode: boolean
  adId?: string
}

type AdCreationAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_AD_TYPE"; payload: string }
  | { type: "UPDATE_FORM"; payload: Partial<AdFormData> }
  | { type: "ADD_PHOTO"; payload: string }
  | { type: "REMOVE_PHOTO"; payload: number }
  | {
      type: "TOGGLE_SELECTION"
      payload: {
        field: keyof Pick<
          AdFormData,
          "ethnicity" | "bodyType" | "breastType" | "hairColor" | "services" | "catersTo" | "placeOfService"
        >
        value: string
      }
    }
  | { type: "RESET_FORM" }
  | { type: "INITIALIZE_EDIT"; payload: { initialAd: any; adId: string } }

const initialState: AdFormData = {
  step: 0, // 0 = ad type selection, 1-3 = form steps
  adType: null,
  name: "",
  category: "Escort",
  age: "",
  contactPreference: "email",
  email: "",
  phone: "",
  whatsapp: false,
  sms: false,
  state: "",
  city: "",
  title: "",
  description: "",
  ethnicity: [],
  nationality: [],
  bodyType: [],
  breastType: [],
  hairColor: [],
  services: [],
  catersTo: [],
  placeOfService: [],
  incallRates: {
    "0.5": "",
    "1": "",
    "2": "",
    "3": "",
    "6": "",
    "12": "",
    "24": "",
    "48": "",
    "overnight": "",
  },
  outcallRates: {
    "0.5": "",
    "1": "",
    "2": "",
    "3": "",
    "6": "",
    "12": "",
    "24": "",
    "48": "",
    "overnight": "",
  },
  photos: [],
  termsAccepted: false,
  isEditMode: false,
  adId: undefined,
}

function adCreationReducer(state: AdFormData, action: AdCreationAction): AdFormData {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload }
    case "SET_AD_TYPE":
      return { ...state, adType: action.payload }
    case "UPDATE_FORM":
      return { ...state, ...action.payload }
    case "ADD_PHOTO":
      if (state.photos.length >= 10) {
        return state
      }
      return { ...state, photos: [...state.photos, action.payload] }
    case "REMOVE_PHOTO":
      return {
        ...state,
        photos: state.photos.filter((_, index) => index !== action.payload),
      }
    case "TOGGLE_SELECTION":
      const { field, value } = action.payload
      const currentValues = state[field]
      if (Array.isArray(currentValues)) {
        return {
          ...state,
          [field]: currentValues.includes(value)
            ? currentValues.filter((item) => item !== value)
            : [...currentValues, value],
        }
      }
      return state
    case "INITIALIZE_EDIT":
      const { initialAd, adId } = action.payload
      return {
        ...state,
        step: 1, // Start at step 1 for edit mode
        isEditMode: true,
        adId: adId,
        adType: initialAd.adType || "free",
        name: initialAd.name || "",
        category: initialAd.category || "Escort",
        age: initialAd.age || "",
        contactPreference: initialAd.contactPreference || "email",
        email: initialAd.email || "",
        phone: initialAd.phone || "",
        whatsapp: initialAd.whatsapp || false,
        sms: initialAd.sms || initialAd.smsEnabled || false,
        state: initialAd.state || "",
        city: initialAd.city || "",
        title: initialAd.title || "",
        description: initialAd.description || "",
        ethnicity: initialAd.ethnicity || [],
        nationality: initialAd.nationality || [],
        bodyType: initialAd.bodyType || [],
        breastType: initialAd.breastType || [],
        hairColor: initialAd.hairColor || [],
        services: initialAd.services || [],
        catersTo: initialAd.catersTo || [],
        placeOfService: initialAd.placeOfService || [],
        incallRates: initialAd.incallRates || state.incallRates,
        outcallRates: initialAd.outcallRates || state.outcallRates,
        photos: initialAd.photos || [],
        termsAccepted: true, // Assume accepted if editing existing ad
      }
    case "RESET_FORM":
      return initialState
    default:
      return state
  }
}

type AdCreationContextType = {
  state: AdFormData
  dispatch: React.Dispatch<AdCreationAction>
}

const AdCreationContext = createContext<AdCreationContextType | undefined>(undefined)

interface AdCreationProviderProps {
  children: React.ReactNode;
  initialAd?: any;
  isEditMode?: boolean;
  adId?: string;
}

export function AdCreationProvider({ children, initialAd, isEditMode = false, adId }: AdCreationProviderProps) {
  const [state, dispatch] = useReducer(adCreationReducer, initialState)

  // Initialize edit mode if provided
  React.useEffect(() => {
    if (isEditMode && initialAd && adId) {
      dispatch({ type: "INITIALIZE_EDIT", payload: { initialAd, adId } })
    }
  }, [isEditMode, initialAd, adId])

  return <AdCreationContext.Provider value={{ state, dispatch }}>{children}</AdCreationContext.Provider>
}

export function useAdCreation() {
  const context = useContext(AdCreationContext)
  if (context === undefined) {
    throw new Error("useAdCreation must be used within an AdCreationProvider")
  }
  return context
} 