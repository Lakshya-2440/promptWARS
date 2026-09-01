"use client";

import React from "react";
import { Tv, Users, Plus, Trash2 } from "lucide-react";
import type { WizardStepAssetsProps, MemberRecord } from "../types";

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const COMPUTING_OPTIONS = [
  { value: "laptop_with_internet", label: "Laptop / PC with Net" },
  { value: "laptop_no_internet", label: "Laptop without Net" },
  { value: "none", label: "None" },
];

const RELATION_OPTIONS = [
  { value: "Head", label: "Head" },
  { value: "Spouse", label: "Spouse" },
  { value: "Son/Daughter", label: "Son / Daughter" },
  { value: "Parent", label: "Parent" },
  { value: "Other", label: "Other Relative" },
];

/** A single asset toggle card */
function AssetToggle({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
      <label htmlFor={id} className="text-slate-400 block mb-1 font-medium text-xs">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-navy-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
      >
        {YES_NO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** A single member row in the household roster */
function MemberRow({
  member,
  index,
  canRemove,
  onRemove,
  onChange,
}: {
  member: MemberRecord;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (field: keyof MemberRecord, value: string | number) => void;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="font-bold text-saffron-400 text-xs">
          Member #{index + 1} ({member.relation})
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-rose-400 p-1"
            aria-label={`Remove member ${member.name || index + 1}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label htmlFor={`member-name-${member.id}`} className="block text-[11px] text-slate-400 mb-1">Full Name</label>
          <input
            id={`member-name-${member.id}`}
            type="text"
            value={member.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Name"
            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
          />
        </div>

        <div>
          <label htmlFor={`member-age-${member.id}`} className="block text-[11px] text-slate-400 mb-1">Exact Age</label>
          <input
            id={`member-age-${member.id}`}
            type="number"
            min={0}
            max={120}
            value={member.age}
            onChange={(e) => onChange("age", e.target.value)}
            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
          />
        </div>

        <div>
          <label htmlFor={`member-relation-${member.id}`} className="block text-[11px] text-slate-400 mb-1">Relationship</label>
          <select
            id={`member-relation-${member.id}`}
            value={member.relation}
            onChange={(e) => onChange("relation", e.target.value)}
            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
          >
            {RELATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Wizard Step 4: Digital assets inventory and household member demographics roster.
 * Covers Census HLO questions on consumer durables and individual member enumeration.
 */
export function WizardStepAssets({
  formData,
  onFieldChange,
  translations: wt,
  members,
  onMemberChange,
  onAddMember,
  onRemoveMember,
}: WizardStepAssetsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-display font-black text-base text-white flex items-center gap-2">
          <Tv className="w-4 h-4 text-saffron-400" />
          {wt.step4Heading}
        </h3>
      </div>

      {/* Assets Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-300 block">{wt.assetsHeading}</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <AssetToggle
            id="wizard-internet"
            label="Internet Access"
            value={String(formData.hasInternet ?? "yes")}
            onChange={(val) => onFieldChange("hasInternet", val)}
          />
          <AssetToggle
            id="wizard-tv"
            label="Television"
            value={String(formData.hasTv ?? "yes")}
            onChange={(val) => onFieldChange("hasTv", val)}
          />
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
            <label htmlFor="wizard-computing" className="text-slate-400 block mb-1 font-medium text-xs">
              Computing Device
            </label>
            <select
              id="wizard-computing"
              value={formData.hasLaptop ?? "laptop_with_internet"}
              onChange={(e) => onFieldChange("hasLaptop", e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
            >
              {COMPUTING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Roster */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            {wt.membersHeading} ({members.length})
          </span>
          <button
            type="button"
            onClick={onAddMember}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/30"
          >
            <Plus className="w-3.5 h-3.5" /> {wt.addMemberBtn}
          </button>
        </div>

        <div className="space-y-3">
          {members.map((m, idx) => (
            <MemberRow
              key={m.id}
              member={m}
              index={idx}
              canRemove={members.length > 1}
              onRemove={() => onRemoveMember(m.id)}
              onChange={(field, value) => onMemberChange(m.id, field, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
