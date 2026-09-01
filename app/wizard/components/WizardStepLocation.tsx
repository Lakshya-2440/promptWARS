"use client";

import React from "react";
import { Home, Volume2 } from "lucide-react";
import { ALL_STATES } from "@/lib/db/seed-data";
import { FormField, SelectField } from "@/components/ui";
import type { WizardStepLocationProps } from "../types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "transgender", label: "Transgender" },
];

const SOCIAL_CATEGORY_OPTIONS = [
  { value: "sc", label: "Scheduled Caste (SC)" },
  { value: "st", label: "Scheduled Tribe (ST)" },
  { value: "other", label: "Other / General" },
];

/**
 * Wizard Step 1: Household location identifiers and head-of-household details.
 * Covers Census HLO questions 1–8 (state, district, building, household head).
 */
export function WizardStepLocation({
  formData,
  onFieldChange,
  translations: wt,
  onSpeak,
  onStateCodeChange,
}: WizardStepLocationProps) {
  const stateOptions = ALL_STATES.map((s) => ({
    value: s.code,
    label: `${s.name} (${s.code})`,
  }));

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-display font-black text-base text-white flex items-center gap-2">
          <Home className="w-4 h-4 text-saffron-400" />
          {wt.step1Heading}
        </h3>
        {onSpeak && (
          <button
            type="button"
            onClick={() => onSpeak(wt.step1Heading)}
            className="p-1 rounded bg-navy-950 text-slate-400 hover:text-white"
            title="Read instructions aloud"
            aria-label="Read Step 1 instructions aloud"
          >
            <Volume2 className="w-4 h-4 text-saffron-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <SelectField
          id="wizard-state"
          label={wt.stateLabel}
          value={formData.stateCode}
          onChange={(val) => {
            onFieldChange("stateCode", val);
            onStateCodeChange(val);
          }}
          options={stateOptions}
        />

        <FormField
          id="wizard-district"
          label={wt.districtLabel}
          value={formData.districtName ?? ""}
          onChange={(val) => onFieldChange("districtName", val)}
        />

        <FormField
          id="wizard-building"
          label={wt.buildingLabel}
          value={formData.buildingNumber ?? ""}
          onChange={(val) => onFieldChange("buildingNumber", val)}
        />

        <FormField
          id="wizard-census-house"
          label={wt.censusHouseLabel}
          value={formData.censusHouseNumber ?? ""}
          onChange={(val) => onFieldChange("censusHouseNumber", val)}
        />

        <FormField
          id="wizard-head-name"
          label={wt.headNameLabel}
          value={formData.headName ?? ""}
          onChange={(val) => onFieldChange("headName", val)}
          fullWidth
        />

        <SelectField
          id="wizard-head-gender"
          label={wt.headSexLabel || "Sex of Head"}
          value={formData.headGender ?? "male"}
          onChange={(val) => onFieldChange("headGender", val)}
          options={GENDER_OPTIONS}
        />

        <SelectField
          id="wizard-social-category"
          label={wt.socialCategoryLabel || "Social Category"}
          value={formData.socialCategory ?? "other"}
          onChange={(val) => onFieldChange("socialCategory", val)}
          options={SOCIAL_CATEGORY_OPTIONS}
        />
      </div>
    </div>
  );
}
