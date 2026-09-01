/**
 * Wizard-specific types for the 5-step Census self-enumeration practice flow.
 * Separated from page component to improve modularity and testability.
 */

/** A single household member record in the practice enumeration roster */
export interface MemberRecord {
  id: string;
  name: string;
  relation: string;
  gender: string;
  age: number | string;
  maritalStatus: string;
  isLiterate: string;
  casteCategory: string;
}

/** Form data state for all wizard steps (location, housing, amenities, assets) */
export type WizardFormData = Record<string, string | number>;

/** Props shared by all wizard step components */
export interface WizardStepProps {
  /** Current form data across all steps */
  formData: WizardFormData;
  /** Handler to update a single form field */
  onFieldChange: (field: string, value: string | number) => void;
  /** Translated UI strings for the wizard */
  translations: Record<string, string>;
  /** Text-to-speech reader for accessibility */
  onSpeak?: (text: string) => void;
}

/** Props for Step 1 — extends base with state-specific logic */
export interface WizardStepLocationProps extends WizardStepProps {
  onStateCodeChange: (code: string) => void;
}

/** Props for Step 4 — extends base with member roster management */
export interface WizardStepAssetsProps extends WizardStepProps {
  members: MemberRecord[];
  onMemberChange: (id: string, field: keyof MemberRecord, value: string | number) => void;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
}

/** Props for Step 5 — submission result display */
export interface WizardStepSlipProps {
  formData: WizardFormData;
  members: MemberRecord[];
  submissionResult: import("@/types/census").PracticeSubmissionResult | null;
  translations: Record<string, string>;
  onPracticeAgain: () => void;
}

/** Props for the wizard progress indicator */
export interface WizardProgressBarProps {
  currentStep: number;
  translations: Record<string, string>;
}

/** Props for the AI Sathi sidebar panel */
export interface WizardSidebarProps {
  currentStep: number;
  onOpenAssistant: (prompt: string) => void;
}
