"use client";

import React from "react";

interface FormFieldProps {
  /** Label text displayed above the input */
  label: string;
  /** HTML id for the input — links label to input for accessibility */
  id: string;
  /** Current value of the input */
  value: string | number;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type (text, number, tel, etc.) */
  type?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Min value for number inputs */
  min?: number;
  /** Max value for number inputs */
  max?: number;
  /** Whether the field spans the full grid width */
  fullWidth?: boolean;
  /** Optional helper text displayed below the input */
  helperText?: string;
  /** Disables the input */
  disabled?: boolean;
}

/**
 * Reusable labeled form input with consistent Census 2027 styling.
 * Eliminates repetitive label+input JSX across wizard steps.
 */
export function FormField({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  fullWidth = false,
  helperText,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="block font-bold text-slate-300 mb-1 text-xs">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:border-saffron-500 focus:outline-none disabled:opacity-50"
      />
      {helperText && (
        <span className="text-[10px] text-slate-500 mt-0.5 block">{helperText}</span>
      )}
    </div>
  );
}
