import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center transition-all duration-200 font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary-500/15 text-primary-500 ring-1 ring-primary-500/30",
        secondary: "bg-secondary-700/50 text-secondary-200 ring-1 ring-secondary-600/50",
        success: "bg-success-500/15 text-success-500 ring-1 ring-success-500/30",
        warning: "bg-warning-500/15 text-warning-500 ring-1 ring-warning-500/30",
        error: "bg-error-500/15 text-error-500 ring-1 ring-error-500/30",
        info: "bg-info-500/15 text-info-500 ring-1 ring-info-500/30",
        outline: "bg-transparent ring-1 ring-secondary-500 text-secondary-300",
      },
      size: {
        sm: "text-xs px-2 py-0.5 rounded",
        md: "text-sm px-2.5 py-0.5 rounded-md",
        lg: "text-base px-3 py-1 rounded-lg",
      },
      glow: {
        true: "shadow-[0_0_12px_-3px_var(--glow-color)]",
      },
      dot: {
        true: "pl-1.5",  // Reduced left padding to accommodate the dot
      },
      interactive: {
        true: "cursor-pointer hover:scale-105 active:scale-95",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
      glow: false,
      dot: false,
      interactive: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Badge({
  className,
  variant,
  size,
  glow,
  dot,
  interactive,
  leftIcon,
  rightIcon,
  children,
  style,
  ...props
}: BadgeProps) {
  // Set glow color based on variant
  const glowColors = {
    primary: "var(--primary-500)",
    secondary: "var(--secondary-500)",
    success: "var(--success-500)",
    warning: "var(--warning-500)",
    error: "var(--error-500)",
    info: "var(--info-500)",
    outline: "var(--secondary-500)",
  };

  const glowStyle = glow && variant
    ? { "--glow-color": glowColors[variant as keyof typeof glowColors], ...style }
    : style;

  return (
    <span
      className={cn(badgeVariants({ variant, size, glow, dot, interactive }), className)}
      style={glowStyle}
      {...props}
    >
      {dot && (
        <span className={cn(
          "mr-1.5 h-2 w-2 rounded-full",
          variant === "primary" && "bg-primary-500",
          variant === "secondary" && "bg-secondary-400",
          variant === "success" && "bg-success-500",
          variant === "warning" && "bg-warning-500",
          variant === "error" && "bg-error-500",
          variant === "info" && "bg-info-500",
          variant === "outline" && "bg-secondary-400",
        )} />
      )}
      {leftIcon && <span className="mr-1 -ml-0.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1 -mr-0.5">{rightIcon}</span>}
    </span>
  );
}

Badge.displayName = "Badge";
