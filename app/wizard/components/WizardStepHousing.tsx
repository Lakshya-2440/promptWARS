"use client";

import React from "react";
import { Layers } from "lucide-react";
import { FormField, SelectField } from "@/components/ui";
import type { WizardStepProps } from "../types";

const OWNERSHIP_OPTIONS = [
  { value: "owned", label: "Owned" },
  { value: "rented", label: "Rented" },
  { value: "other", label: "Other" },
];

const FLOOR_OPTIONS = [
  { value: "mud", label: "Mud / Earth" },
  { value: "wood", label: "Wood / Bamboo" },
  { value: "burnt_brick", label: "Burnt Brick / Stone" },
  { value: "cement", label: "Cement" },
  { value: "mosaic_tiles", label: "Mosaic / Floor Tiles / Marble" },
];

const ROOF_OPTIONS = [
  { value: "grass_thatch", label: "Grass / Thatch / Wood" },
  { value: "tiles_slate", label: "Tiles / Slate" },
  { value: "metal_asbestos", label: "Metal / Asbestos Sheets" },
  { value: "concrete_rcc", label: "Concrete (RCC)" },
];

/**
 * Wizard Step 2: Housing structure characteristics.
 * Covers Census HLO questions on ownership, floor/wall/roof materials, and room count.
 */
export function WizardStepHousing({ formData, onFieldChange, translations: wt }: WizardStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-display font-black text-base text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-saffron-400" />
          {wt.step2Heading}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <SelectField
          id="wizard-ownership"
          label={wt.ownershipLabel}
          value={formData.ownershipStatus ?? "owned"}
          onChange={(val) => onFieldChange("ownershipStatus", val)}
          options={OWNERSHIP_OPTIONS}
        />

        <SelectField
          id="wizard-floor"
          label={wt.floorLabel}
          value={formData.floorMaterial ?? "mosaic_tiles"}
          onChange={(val) => onFieldChange("floorMaterial", val)}
          options={FLOOR_OPTIONS}
        />

        <SelectField
          id="wizard-roof"
          label={wt.roofLabel}
          value={formData.roofMaterial ?? "concrete_rcc"}
          onChange={(val) => onFieldChange("roofMaterial", val)}
          options={ROOF_OPTIONS}
        />

        <FormField
          id="wizard-rooms"
          label={wt.roomsLabel}
          type="number"
          min={1}
          max={20}
          value={formData.dwellingRooms ?? 3}
          onChange={(val) => onFieldChange("dwellingRooms", Number(val))}
        />

        <FormField
          id="wizard-couples"
          label={wt.couplesLabel}
          type="number"
          min={0}
          max={10}
          value={formData.marriedCouplesCount ?? 1}
          onChange={(val) => onFieldChange("marriedCouplesCount", Number(val))}
        />
      </div>
    </div>
  );
}
