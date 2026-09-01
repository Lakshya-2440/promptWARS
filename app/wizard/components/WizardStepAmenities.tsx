"use client";

import React from "react";
import { Droplets } from "lucide-react";
import { SelectField } from "@/components/ui";
import type { WizardStepProps } from "../types";

const WATER_SOURCE_OPTIONS = [
  { value: "tap_treated", label: "Piped Tap Water (Treated Source)" },
  { value: "tap_untreated", label: "Piped Tap Water (Untreated)" },
  { value: "covered_well", label: "Covered Well" },
  { value: "handpump", label: "Hand Pump / Borewell" },
  { value: "river_canal", label: "River / Canal / Tank" },
];

const WATER_AVAIL_OPTIONS = [
  { value: "within_premises", label: "Within premises" },
  { value: "near_premises", label: "Near premises (<100m)" },
  { value: "away", label: "Away" },
];

const LIGHTING_OPTIONS = [
  { value: "electricity", label: "Electricity (Grid power)" },
  { value: "solar", label: "Solar Energy" },
  { value: "kerosene", label: "Kerosene" },
];

const LATRINE_OPTIONS = [
  { value: "within_premises", label: "Flush / Pour Flush within premises" },
  { value: "community_toilet", label: "Community / Public Latrine" },
  { value: "open", label: "Open / No latrine" },
];

const FUEL_OPTIONS = [
  { value: "lpg_png", label: "LPG / Piped Natural Gas (PNG)" },
  { value: "electricity", label: "Electricity / Induction" },
  { value: "biogas", label: "Biogas" },
  { value: "firewood", label: "Firewood" },
];

/**
 * Wizard Step 3: Water, sanitation, lighting, and cooking fuel.
 * Covers Census HLO questions on drinking water, latrine, lighting source, and fuel type.
 */
export function WizardStepAmenities({ formData, onFieldChange, translations: wt }: WizardStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-display font-black text-base text-white flex items-center gap-2">
          <Droplets className="w-4 h-4 text-emerald-400" />
          {wt.step3Heading}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <SelectField
          id="wizard-water-source"
          label={wt.waterSourceLabel}
          value={formData.drinkingWaterSource ?? "tap_treated"}
          onChange={(val) => onFieldChange("drinkingWaterSource", val)}
          options={WATER_SOURCE_OPTIONS}
        />

        <SelectField
          id="wizard-water-avail"
          label={wt.waterAvailLabel}
          value={formData.waterAvailability ?? "within_premises"}
          onChange={(val) => onFieldChange("waterAvailability", val)}
          options={WATER_AVAIL_OPTIONS}
        />

        <SelectField
          id="wizard-lighting"
          label={wt.lightingLabel}
          value={formData.lightingSource ?? "electricity"}
          onChange={(val) => onFieldChange("lightingSource", val)}
          options={LIGHTING_OPTIONS}
        />

        <SelectField
          id="wizard-latrine"
          label={wt.latrineLabel}
          value={formData.latrineFacility ?? "within_premises"}
          onChange={(val) => onFieldChange("latrineFacility", val)}
          options={LATRINE_OPTIONS}
        />

        <SelectField
          id="wizard-fuel"
          label={wt.fuelLabel}
          value={formData.cookingFuel ?? "lpg_png"}
          onChange={(val) => onFieldChange("cookingFuel", val)}
          options={FUEL_OPTIONS}
        />
      </div>
    </div>
  );
}
