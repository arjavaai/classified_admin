"use client"

import type React from "react"
import { useAdCreation } from "./ad-creation-context"
import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { getStates, getCitiesByStateCode } from "../../lib/demo-data"

// Import nationality data from search modal
const ethnicities = ["Arabian", "Asian", "Ebony", "Caucasian", "Hispanic", "Indian", "Latin", "Mixed race", "Others"]
const allNationalities = [
  "Albanian", "American", "Arabic", "Argentinian", "Australian", "Austrian", 
  "Bangladeshi", "Belgian", "Bolivian", "Bosnian", "Brazilian", "Bulgarian", 
  "Canadian", "Chilean", "Chinese", "Colombian", "Costa Rican", "Croatian", 
  "Cuban", "Czech", "Danish", "Dominican", "Dutch", "Ecuadorian", "English", 
  "Estonian", "Filipino", "Finnish", "French", "German", "Greek", "Guatemalan", 
  "Haitian", "Honduran", "Hungarian", "Indian", "Indonesian", "Irish", "Italian", 
  "Jamaican", "Japanese", "Kenyan", "Latvian", "Lithuanian", "Malaysian", 
  "Maldivian", "Mexican", "Moldovan", "Moroccan", "NewZealander", "Nicaraguan", 
  "Nigerian", "Norwegian", "Pakistani", "Panamanian", "Paraguayan", "Peruvian", 
  "Polish", "Portuguese", "Romanian", "Russian", "Senegalese", "Serbian", 
  "Singaporean", "South African", "Spanish", "Swedish", "Swiss", "Thai", 
  "Tunisian", "Turkish", "Ukrainian", "Uruguayan", "Venezuelan", "Vietnamese"
]
const bodyTypes = ["Slender", "Athletic", "Curvy", "BBW"]
const breastTypes = ["Natural Boobs", "Busty"]
const hairColors = ["Blond Hair", "Brown Hair", "Black Hair", "Red Hair", "Others"]
const ageRanges = ["18-19", "20s", "30s", "40s", "50s", "60+"]
const services = [
  "Oral", "Anal", "BDSM", "Girlfriend experience", "Body ejaculation",
  "Erotic massage", "Tantric massage", "Fetish", "French kiss", "Role play",
  "Threesome", "Sexting", "Videocall",
]
const catersTo = ["Men", "Women", "Non-binary", "Couples"]



// Import AdFormData type from context
import { AdFormData as AdFormDataType } from "./ad-creation-context"

// Define the local AdFormData interface
interface AdFormData extends Omit<AdFormDataType, 'step' | 'adType' | 'photos' | 'termsAccepted'> {
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
}

export default function AdFormStep1({ disableForm = false }: { disableForm?: boolean }) {
  const { state, dispatch } = useAdCreation()
  const [statesList, setStatesList] = useState<{name: string; abbreviation: string}[]>([])
  const [citiesList, setCitiesList] = useState<{name: string; slug: string}[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load states when component mounts
  useEffect(() => {
    setStatesList(getStates())
  }, [])

  // Update cities when state changes
  useEffect(() => {
    if (state.state) {
      // Find the state abbreviation from the full state name
      const stateObj = statesList.find(s => s.name === state.state);
      if (stateObj) {
        setCitiesList(getCitiesByStateCode(stateObj.abbreviation));
      } else {
        setCitiesList([]);
      }
    } else {
      setCitiesList([]);
    }
  }, [state.state, statesList])

  const handleChange = (field: keyof AdFormData, value: string | boolean | string[]) => {
    dispatch({
      type: "UPDATE_FORM",
      payload: { [field]: value }
    })
  }

  const toggleSelection = (
    field: keyof Pick<
      AdFormData,
      "ethnicity" | "bodyType" | "breastType" | "hairColor" | "services" | "catersTo" | "placeOfService" | "nationality"
    >,
    value: string,
  ) => {
    const currentValues = state[field] as string[] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    
    handleChange(field, newValues)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!state.name) errors.name = "Name is required"
    if (!state.age) errors.age = "Age is required"
    if (!state.title) errors.title = "Title is required"
    if (!state.description) errors.description = "Description is required"
    if (!state.state) errors.state = "State is required"
    if (!state.city) errors.city = "City is required"
    
    // Phone validation when phone is selected as contact preference
    if ((state.contactPreference === "phone" || state.contactPreference === "both") && !state.phone) {
      errors.phone = "Phone number is required"
    }
    
    // Age validation
    const age = parseInt(state.age)
    if (state.age && (age < 18 || age > 99)) {
      errors.age = age < 18 ? "Age must be 18 or older" : "Age must be 99 or younger"
    }
    
    return errors
  }

  const goToNextStep = () => {
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors({})
    dispatch({ type: "SET_STEP", payload: 2 })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="w-full">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Two-column layout for basic info on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={state.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter Name"
              className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
              disabled={disableForm}
            />
            {validationErrors.name && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{validationErrors.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Age Field */}
          <div>
            <label htmlFor="age" className="block text-lg font-medium text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={state.age}
              onChange={(e) => handleChange("age", e.target.value)}
              min="18"
              max="99"
              placeholder="Enter Age"
              className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.age ? 'border-red-500' : 'border-gray-300'}`}
              disabled={disableForm}
            />
            {validationErrors.age && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{validationErrors.age}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Preference Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            How would you like to be connected? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: "email", label: "Only Email" },
              { value: "phone", label: "Only Phone" },
              { value: "both", label: "Email & Phone" }
            ].map((option) => (
              <div
                key={option.value}
                className={`flex items-center border p-4 rounded-lg cursor-pointer transition-colors ${
                  state.contactPreference === option.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => handleChange("contactPreference", option.value as "email" | "phone" | "both")}
              >
                <input
                  type="radio"
                  name="contactPreference"
                  value={option.value}
                  checked={state.contactPreference === option.value}
                  onChange={() => handleChange("contactPreference", option.value as "email" | "phone" | "both")}
                  className="mr-3 w-5 h-5 text-blue-600"
                  disabled={disableForm}
                />
                <label className="text-gray-700 text-lg cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column layout for contact info on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Field */}
          {(state.contactPreference === "email" || state.contactPreference === "both") && (
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={state.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter Email"
                className="w-full p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={disableForm}
              />
            </div>
          )}

          {/* Phone Field */}
          {(state.contactPreference === "phone" || state.contactPreference === "both") && (
            <div>
              <label htmlFor="phone" className="block text-lg font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={state.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter Phone Number"
                className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                disabled={disableForm}
              />
              {validationErrors.phone && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-red-800 text-sm font-medium">{validationErrors.phone}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp and SMS Options */}
        {(state.contactPreference === "phone" || state.contactPreference === "both") && (
          <div className="flex flex-wrap items-center gap-6">
            {/* WhatsApp Toggle */}
            <div className="flex items-center space-x-4">
              <label className="text-lg font-medium text-gray-700">WhatsApp</label>
              <div 
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer ${
                  state.whatsapp 
                    ? "bg-blue-600" 
                    : "bg-gray-200 border border-blue-600"
                }`}
                onClick={() => !disableForm && handleChange("whatsapp", !state.whatsapp)}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform shadow-sm ${
                    state.whatsapp ? "translate-x-8" : "translate-x-0"
                  }`}
                >
                  <span className={`text-xs font-medium ${state.whatsapp ? "text-blue-600" : "text-gray-500"}`}>
                    {state.whatsapp ? "Yes" : "No"}
                  </span>
                </span>
              </div>
            </div>
            
            {/* SMS Toggle */}
            <div className="flex items-center space-x-4">
              <label className="text-lg font-medium text-gray-700">SMS</label>
              <div 
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer ${
                  state.sms 
                    ? "bg-blue-600" 
                    : "bg-gray-200 border border-blue-600"
                }`}
                onClick={() => !disableForm && handleChange("sms", !state.sms)}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform shadow-sm ${
                    state.sms ? "translate-x-8" : "translate-x-0"
                  }`}
                >
                  <span className={`text-xs font-medium ${state.sms ? "text-blue-600" : "text-gray-500"}`}>
                    {state.sms ? "Yes" : "No"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout for location on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* State Field */}
          <div>
            <label htmlFor="state" className="block text-lg font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              id="state"
              value={state.state}
              onChange={(e) => {
                handleChange("state", e.target.value)
                handleChange("city", "") // Reset city when state changes
              }}
              className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.state ? 'border-red-500' : 'border-gray-300'}`}
              disabled={disableForm}
            >
              <option value="">Select State</option>
              {statesList.map((stateItem) => (
                <option key={stateItem.abbreviation} value={stateItem.name}>
                  {stateItem.name}
                </option>
              ))}
            </select>
            {validationErrors.state && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{validationErrors.state}</p>
                </div>
              </div>
            )}
          </div>

          {/* City Field */}
          <div>
            <label htmlFor="city" className="block text-lg font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <select
              id="city"
              value={state.city}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled={!state.state || disableForm}
              className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.city ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">{state.state ? "Select City" : "Select State First"}</option>
              {citiesList.map((city) => (
                <option key={city.slug} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            {validationErrors.city && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{validationErrors.city}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="title" className="text-lg font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-sm font-medium ${
              state.title.length < 10 ? 'text-red-500' : 
              state.title.length > 200 ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {state.title.length}/200
            </span>
          </div>
          <input
            type="text"
            id="title"
            name="title"
            value={state.title}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                handleChange("title", e.target.value)
              }
            }}
            placeholder="Enter your ad title"
            maxLength={200}
            className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              state.title.length < 10 && state.title.length > 0 ? 'border-red-500' : 
              validationErrors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={disableForm}
          />
          {state.title.length < 10 && state.title.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm font-medium">Title must be at least 10 characters (currently {state.title.length})</p>
              </div>
            </div>
          )}
          {validationErrors.title && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm font-medium">{validationErrors.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="description" className="text-lg font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <span className={`text-sm font-medium ${
              state.description.length < 50 ? 'text-red-500' : 
              state.description.length > 3500 ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {state.description.length}/3500
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            value={state.description}
            onChange={(e) => {
              if (e.target.value.length <= 3500) {
                handleChange("description", e.target.value)
              }
            }}
            rows={5}
            placeholder="Tell potential clients about yourself and your services..."
            maxLength={3500}
            className={`w-full p-4 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              state.description.length < 50 && state.description.length > 0 ? 'border-red-500' : 
              validationErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={disableForm}
          />
          {state.description.length < 50 && state.description.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm font-medium">Description must be at least 50 characters (currently {state.description.length})</p>
              </div>
            </div>
          )}
          {validationErrors.description && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm font-medium">{validationErrors.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nationality Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Nationality
          </label>
          <div className="flex flex-wrap gap-2">
            {allNationalities.map((nationality) => (
              <FilterChip
                key={nationality}
                label={nationality}
                active={state.nationality.includes(nationality)}
                onClick={() => !disableForm && toggleSelection("nationality", nationality)}
              />
            ))}
          </div>
        </div>

        {/* Ethnicity Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Ethnicity
          </label>
          <div className="flex flex-wrap gap-2">
            {ethnicities.map((ethnicity) => (
              <FilterChip
                key={ethnicity}
                label={ethnicity}
                active={state.ethnicity.includes(ethnicity)}
                onClick={() => !disableForm && toggleSelection("ethnicity", ethnicity)}
              />
            ))}
          </div>
        </div>

        {/* Body Type Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Body Type
          </label>
          <div className="flex flex-wrap gap-2">
            {bodyTypes.map((bodyType) => (
              <FilterChip
                key={bodyType}
                label={bodyType}
                active={state.bodyType.includes(bodyType)}
                onClick={() => !disableForm && toggleSelection("bodyType", bodyType)}
              />
            ))}
          </div>
        </div>

        {/* Breast Type Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Breast
          </label>
          <div className="flex flex-wrap gap-2">
            {breastTypes.map((breastType) => (
              <FilterChip
                key={breastType}
                label={breastType}
                active={state.breastType.includes(breastType)}
                onClick={() => !disableForm && toggleSelection("breastType", breastType)}
              />
            ))}
          </div>
        </div>

        {/* Hair Color Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Hair
          </label>
          <div className="flex flex-wrap gap-2">
            {hairColors.map((hairColor) => (
              <FilterChip
                key={hairColor}
                label={hairColor}
                active={state.hairColor.includes(hairColor)}
                onClick={() => !disableForm && toggleSelection("hairColor", hairColor)}
              />
            ))}
          </div>
        </div>

        {/* Services Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Services
          </label>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <FilterChip
                key={service}
                label={service}
                active={state.services.includes(service)}
                onClick={() => !disableForm && toggleSelection("services", service)}
              />
            ))}
          </div>
        </div>

        {/* Caters To Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Caters to
          </label>
          <div className="flex flex-wrap gap-2">
            {catersTo.map((option) => (
              <FilterChip
                key={option}
                label={option}
                active={state.catersTo.includes(option)}
                onClick={() => !disableForm && toggleSelection("catersTo", option)}
              />
            ))}
          </div>
        </div>

        {/* Place of Services Field */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Place of services
          </label>
          <div className="flex flex-wrap gap-2">
            {["At home", "Events and parties", "Hotel / Motel", "Clubs", "Incall", "Outcall"].map((place) => (
              <FilterChip
                key={place}
                label={place}
                active={state.placeOfService.includes(place)}
                onClick={() => !disableForm && toggleSelection("placeOfService", place)}
              />
            ))}
          </div>
        </div>

        {/* Incall Rates Table */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Incall Rates
          </label>
          <RatesTable
            rates={state.incallRates}
            onChange={(key, value) => {
              const updatedRates = { ...state.incallRates, [key]: value }
              dispatch({ type: "UPDATE_FORM", payload: { incallRates: updatedRates } })
            }}
            disabled={disableForm}
          />
        </div>

        {/* Outcall Rates Table */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Outcall Rates
          </label>
          <RatesTable
            rates={state.outcallRates}
            onChange={(key, value) => {
              const updatedRates = { ...state.outcallRates, [key]: value }
              dispatch({ type: "UPDATE_FORM", payload: { outcallRates: updatedRates } })
            }}
            disabled={disableForm}
          />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_STEP", payload: 0 })}
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
      </form>
    </div>
  )
}

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`py-2 px-4 rounded-md border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-200 hover:border-blue-600 hover:text-blue-600"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface RatesTableProps {
  rates: Record<string, string>
  onChange: (key: string, value: string) => void
  disabled?: boolean
}

function RatesTable({ rates, onChange, disabled = false }: RatesTableProps) {
  const timeOptions = [
    { key: "0.5", label: "0.5 Hour" },
    { key: "1", label: "1 Hour" },
    { key: "2", label: "2 Hours" },
    { key: "3", label: "3 Hours" },
    { key: "6", label: "6 Hours" },
    { key: "12", label: "12 Hours" },
    { key: "24", label: "24 Hours" },
    { key: "48", label: "48 Hours" },
    { key: "overnight", label: "Overnight" },
  ]

  const handleRateChange = (key: string, value: string) => {
    // Only allow numbers with max 6 digits
    if (value === '' || /^\d{1,6}$/.test(value)) {
      onChange(key, value)
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-3 bg-blue-600 text-white font-semibold text-center py-3">
        <div>Time</div>
        <div>Rates</div>
        <div>Currency</div>
      </div>
      <div className="divide-y divide-gray-200">
        {timeOptions.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 items-center py-3 hover:bg-gray-50">
            <div className="text-blue-600 font-medium text-center">{label}</div>
            <div className="px-4">
              <input
                type="text"
                value={rates[key]}
                onChange={(e) => handleRateChange(key, e.target.value)}
                placeholder="Enter rate"
                maxLength={6}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                disabled={disabled}
              />
            </div>
            <div className="text-center font-medium text-gray-600">USD</div>
          </div>
        ))}
      </div>
    </div>
  )
} 