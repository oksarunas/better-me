import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className }) => {
  const baseStyles = "inline-flex items-center px-2 py-1 rounded text-xs font-medium";
  const variantStyles = {
    default: "bg-green-500 text-white",
    secondary: "bg-gray-700 text-gray-300",
    outline: "border border-gray-500 text-gray-300",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
