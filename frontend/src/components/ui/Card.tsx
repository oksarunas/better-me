import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const cardVariants = cva(
  "rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-secondary-800/50 border border-secondary-700 shadow-lg shadow-secondary-900/10",
        solid: "bg-secondary-800 border border-secondary-700 shadow-lg shadow-secondary-900/10",
        glass: "backdrop-blur-md bg-white/5 border border-white/10 shadow-lg shadow-black/10",
        outline: "border-2 border-primary-500/20 bg-transparent shadow-lg shadow-primary-500/5",
        elevated: "bg-gradient-to-b from-secondary-800 to-secondary-900 border border-secondary-700 shadow-xl shadow-secondary-900/20",
      },
      hover: {
        true: "hover:scale-[1.02] hover:shadow-xl hover:border-primary-500/30",
      },
      clickable: {
        true: "cursor-pointer active:scale-[0.98]",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: false,
      clickable: false,
    }
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solid" | "glass" | "outline" | "elevated";
  hover?: boolean;
  clickable?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, clickable, loading, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, hover, clickable }),
        loading && "animate-pulse",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, loading, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-col space-y-1.5 p-6",
        loading && "animate-pulse",
        className
      )} 
      {...props} 
    />
  )
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    const Comp = Component;
    return (
      <Comp
        ref={ref}
        className={cn(
          "font-display font-semibold tracking-tight",
          Component === 'h1' && "text-3xl",
          Component === 'h2' && "text-2xl",
          Component === 'h3' && "text-xl",
          Component === 'h4' && "text-lg",
          Component === 'h5' && "text-base",
          Component === 'h6' && "text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn(
        "text-sm text-secondary-400 leading-relaxed",
        className
      )} 
      {...props} 
    />
  )
);
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  loading?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding, loading, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        !noPadding && "p-6",
        loading && "animate-pulse",
        className
      )} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, noPadding, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex items-center",
        !noPadding && "px-6 py-4",
        "border-t border-secondary-700/50",
        className
      )} 
      {...props} 
    />
  )
);
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardDescriptionProps,
  type CardContentProps,
  type CardFooterProps,
};