import React from "react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: () => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, className }) => {
  return (
    <div
      onClick={onCheckedChange}
      className={`h-6 w-6 flex items-center justify-center border rounded ${
        checked ? "bg-green-500 border-green-500" : "bg-gray-800 border-gray-600"
      } cursor-pointer ${className}`}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
};

export default Checkbox;
