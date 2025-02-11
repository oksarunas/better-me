"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const progressVariants = cva(
  "relative overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-secondary-800",
        glass: "bg-white/10 backdrop-blur-sm",
        outline: "bg-transparent border border-secondary-700",
      },
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
      glow: {
        true: "shadow-[0_0_12px_-3px_var(--glow-color)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      glow: false,
    },
  }
);

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-transform duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "",
        success: "bg-success-500",
        warning: "bg-warning-500",
        error: "bg-error-500",
        info: "bg-info-500",
        rainbow: "bg-gradient-to-r from-primary-500 via-success-500 to-info-500",
      },
      animated: {
        true: "animate-shimmer bg-[length:200%_100%]",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
);

export interface ProgressProps 
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof indicatorVariants>["variant"];
  indicatorClassName?: string;
  animated?: boolean;
  showValue?: boolean;
  label?: string;
  valueLabel?: string;
  max?: number;
  value: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  function Progress({ 
    className, 
    variant, 
    size, 
    glow,
    value = 0, 
    max = 100,
    indicatorVariant = "default",
    indicatorClassName,
    animated = false,
    showValue = false,
    label,
    valueLabel,
    ...props 
  }: ProgressProps, ref: React.Ref<HTMLDivElement>) {
    // Calculate the percentage
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    // Determine indicator color based on percentage if variant is "default"
    let dynamicVariant = indicatorVariant;
    if (indicatorVariant === "default") {
      if (percentage >= 80) dynamicVariant = "success";
      else if (percentage >= 50) dynamicVariant = "info";
      else if (percentage >= 25) dynamicVariant = "warning";
      else dynamicVariant = "error";
    }

    // Set glow color based on variant
    const glowColors = {
      default: `var(--${dynamicVariant}-500)`,
      success: "var(--success-500)",
      warning: "var(--warning-500)",
      error: "var(--error-500)",
      info: "var(--info-500)",
      rainbow: "var(--primary-500)",
    };

    const glowStyle = glow
      ? { "--glow-color": glowColors[dynamicVariant as keyof typeof glowColors] } as React.CSSProperties
      : {};

    return (
      <div className="w-full space-y-1">
        {(label || showValue) && (
          <div className="flex justify-between text-sm text-secondary-300">
            {label && <span>{label}</span>}
            {showValue && (
              <span>{valueLabel || `${Math.round(percentage)}%`}</span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ variant, size, glow }), className)}
          style={glowStyle}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              indicatorVariants({ 
                variant: dynamicVariant, 
                animated 
              }),
              animated && "bg-gradient-to-r from-transparent via-white/25 to-transparent",
              indicatorClassName
            )}
            style={{ 
              transform: `translateX(-${100 - percentage}%)`,
            }}
          />
        </ProgressPrimitive.Root>
      </div>
    )
  }
) as React.ForwardRefExoticComponent<ProgressProps>

Progress.displayName = "Progress"

export { Progress }