"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
  }
>(({ className, value, onValueChange, name, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div
        className={cn("grid gap-2", className)}
        ref={ref}
        role="radiogroup"
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  
  return (
    <input
      ref={ref}
      type="radio"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      checked={context.value === props.value}
      onChange={(e) => {
        if (e.target.checked && context.onValueChange) {
          context.onValueChange(props.value as string)
        }
      }}
      name={context.name}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 