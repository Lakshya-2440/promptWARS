import { StateData } from "../db/seed-data";

/**
 * Enumeration lifecycle state for a given Indian State / Union Territory.
 */
export type PhaseStatus = "active_self_enum" | "active_hlo" | "active_pe" | "upcoming" | "completed";

/**
 * Extended state data object including computed real-time phase status and countdowns.
 */
export interface StateWithComputedStatus extends StateData {
  status: PhaseStatus;
  statusLabel: string;
  daysRemaining?: number;
}

/**
 * Computes active Census phase and remaining days for a state relative to a given date.
 * Pure logic function: safe for both client and server bundles.
 *
 * @param state - State schedule record
 * @param customDate - Optional reference date (defaults to current system time)
 * @returns Computed status, human-readable label, and days remaining
 */
export function computeStateStatus(
  state: StateData,
  customDate?: Date
): { status: PhaseStatus; statusLabel: string; daysRemaining?: number } {
  const now = customDate ? customDate.getTime() : Date.now();

  const selfStart = new Date(state.self_enum_start).getTime();
  const selfEnd = new Date(state.self_enum_end).getTime() + 86400000; // end of day
  const hloStart = new Date(state.hlo_start).getTime();
  const hloEnd = new Date(state.hlo_end).getTime() + 86400000;
  const peStart = new Date(state.pe_start).getTime();
  const peEnd = new Date(state.pe_end).getTime() + 86400000;

  if (now >= selfStart && now <= selfEnd) {
    const days = Math.ceil((selfEnd - now) / (1000 * 60 * 60 * 24));
    return { status: "active_self_enum", statusLabel: "Self-Enumeration Open (15-Day Portal)", daysRemaining: days };
  }

  if (now >= hloStart && now <= hloEnd) {
    const days = Math.ceil((hloEnd - now) / (1000 * 60 * 60 * 24));
    return { status: "active_hlo", statusLabel: "Phase I: House Listing & Housing (HLO) Active", daysRemaining: days };
  }

  if (now >= peStart && now <= peEnd) {
    const days = Math.ceil((peEnd - now) / (1000 * 60 * 60 * 24));
    return { status: "active_pe", statusLabel: "Phase II: Population Enumeration & Caste Census Active", daysRemaining: days };
  }

  if (now < selfStart) {
    const days = Math.ceil((selfStart - now) / (1000 * 60 * 60 * 24));
    return { status: "upcoming", statusLabel: "Opening Soon", daysRemaining: days };
  }

  return { status: "completed", statusLabel: "Phase Complete" };
}
