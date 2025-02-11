"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import type { DayPickerProps } from "react-day-picker"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const calendarVariants = cva(
  "p-3 bg-secondary-800/50 border border-secondary-700 rounded-xl shadow-xl",
  {
    variants: {
      variant: {
        default: "",
        glass: "backdrop-blur-md bg-white/5 border-white/10",
        solid: "bg-secondary-800 border-secondary-700",
      },
      size: {
        default: "w-auto",
        sm: "w-[280px]",
        lg: "w-[400px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type CalendarProps = DayPickerProps & {
  variant?: "default" | "glass" | "solid"
  size?: "default" | "sm" | "lg"
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant,
  size,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(calendarVariants({ variant, size }), className)}
      classNames={{
        root: cn(calendarVariants({ variant, size }), className),
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center px-8",
        caption_label: "text-sm font-medium text-secondary-200",
        dropdown_month: "appearance-none bg-secondary-700 border border-secondary-600 rounded px-2 py-1 text-sm text-secondary-200 cursor-pointer hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500",
        dropdown_year: "appearance-none bg-secondary-700 border border-secondary-600 rounded px-2 py-1 text-sm text-secondary-200 cursor-pointer hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-lg p-1.5",
          "text-secondary-400 hover:text-secondary-100 hover:bg-secondary-700/50",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-secondary-400 rounded-md w-9 font-medium text-[0.8rem] uppercase",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "[&:has([aria-selected])]:bg-primary-500/10"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-lg",
          "aria-selected:opacity-100",
          "hover:bg-secondary-700/50 hover:text-secondary-100",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-800",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors duration-200"
        ),
        day_selected: cn(
          "bg-primary-500 text-white hover:bg-primary-600",
          "focus:bg-primary-500 focus:text-white"
        ),
        day_today: cn(
          "bg-secondary-700/50 text-secondary-100",
          "aria-selected:bg-primary-500 aria-selected:text-white"
        ),
        day_outside: "text-secondary-500 opacity-50 aria-selected:bg-primary-500/5 aria-selected:text-secondary-400",
        day_disabled: "text-secondary-500 opacity-50",
        day_range_middle: "aria-selected:bg-primary-500/15 aria-selected:text-secondary-200",
        day_range_start: "aria-selected:bg-primary-500 aria-selected:text-white rounded-l-lg",
        day_range_end: "aria-selected:bg-primary-500 aria-selected:text-white rounded-r-lg",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        NextMonthButton: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }