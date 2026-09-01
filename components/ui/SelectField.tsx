"use client";

import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  /** Label text displayed above the select */
  label: string;
  /** HTML id for the select — links label to select for accessibility */
  id: string;
  /** Current selected value */
  value: string | number;
  /** Change handler */
  onChange: (value: string) => void;
  /** Array of options to render */
  options: SelectOption[];
  /** Whether the field spans the full grid width */
  fullWidth?: boolean;
  /** Optional helper text displayed below the select */
  helperText?: string;
  /** Disables the select */
  disabled?: boolean;
}

/**
 * Reusable labeled select dropdown with consistent Census 2027 styling.
 * Eliminates repetitive label+select+option JSX across wizard steps.
 */
export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  fullWidth = false,
  helperText,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="block font-bold text-slate-300 mb-1 text-xs">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-semibold focus:border-saffron-500 focus:outline-none disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <span className="text-[10px] text-slate-500 mt-0.5 block">{helperText}</span>
      )}
    </div>
  );
}
