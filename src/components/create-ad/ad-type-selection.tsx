"use client"

import { useAdCreation } from "./ad-creation-context"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const adTypes = [
  {
    id: "service",
    title: "Service Provider",
    description: "Offer your services to potential clients",
  },
  {
    id: "job",
    title: "Job Seeker",
    description: "Find your next opportunity",
  },
  {
    id: "business",
    title: "Business",
    description: "Promote your business or products",
  },
]

export default function AdTypeSelection() {
  const { state, dispatch } = useAdCreation()

  const handleNext = () => {
    if (state.adType) {
      dispatch({ type: "SET_STEP", payload: 1 })
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Select Ad Type</h2>
          <p className="text-gray-600">
            Choose the type of advertisement you want to create
          </p>
        </div>

        <RadioGroup
          value={state.adType}
          onValueChange={(value) => dispatch({ type: "SET_AD_TYPE", payload: value })}
          className="space-y-4"
        >
          {adTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary cursor-pointer"
            >
              <RadioGroupItem value={type.id} id={type.id} />
              <div className="flex-1">
                <Label
                  htmlFor={type.id}
                  className="text-lg font-medium cursor-pointer"
                >
                  {type.title}
                </Label>
                <p className="text-gray-600 mt-1">{type.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!state.adType}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </div>
    </Card>
  )
} 