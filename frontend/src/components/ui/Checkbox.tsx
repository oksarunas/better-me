"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const checkboxVariants = cva(
  "peer h-5 w-5 shrink-0 rounded-md border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: [
          "border-secondary-600 bg-secondary-800/50",
          "hover:border-primary-500/50",
          "data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500",
          "focus-visible:ring-primary-500",
        ],
        success: [
          "border-secondary-600 bg-secondary-800/50",
          "hover:border-success-500/50",
          "data-[state=checked]:border-success-500 data-[state=checked]:bg-success-500",
          "focus-visible:ring-success-500",
        ],
        error: [
          "border-error-500 bg-secondary-800/50",
          "hover:border-error-600",
          "data-[state=checked]:border-error-500 data-[state=checked]:bg-error-500",
          "focus-visible:ring-error-500",
        ],
      },
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size, label, description, error, indeterminate, checked, onChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked ?? false)
    const checkboxRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate ?? false
      }
    }, [indeterminate])

    React.useEffect(() => {
      setIsChecked(checked ?? false)
    }, [checked])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(event.target.checked)
      onChange?.(event)
    }

    return (
      <div className="flex items-start space-x-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            ref={(element) => {
              checkboxRef.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            checked={isChecked}
            onChange={handleChange}
            className={cn(
              checkboxVariants({ variant, size }),
              "cursor-pointer",
              className
            )}
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-opacity",
              isChecked ? "opacity-100" : "opacity-0"
            )}
            aria-hidden="true"
          >
            {indeterminate ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        {(label || description || error) && (
          <div className="space-y-1 leading-none">
            {label && (
              <label
                htmlFor={props.id}
                className={cn(
                  "text-sm font-medium text-secondary-200",
                  props.disabled && "cursor-not-allowed opacity-70"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-secondary-400">{description}</p>
            )}
            {error && (
              <p className="text-xs text-error-500">{error}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
