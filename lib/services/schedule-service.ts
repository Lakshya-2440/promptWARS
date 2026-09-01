import { db } from "../db/store";
import { StateData } from "../db/seed-data";

export type PhaseStatus = "active_self_enum" | "active_hlo" | "active_pe" | "upcoming" | "completed";

export interface StateWithComputedStatus extends StateData {
  status: PhaseStatus;
  statusLabel: string;
  daysRemaining?: number;
}

export function computeStateStatus(state: StateData, customDate?: Date): { status: PhaseStatus; statusLabel: string; daysRemaining?: number } {
  // Use either custom date or current date
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

export const scheduleService = {
  async getAllStates(): Promise<StateWithComputedStatus[]> {
    const states = await db.getStates();
    return states.map((state) => {
      const computed = computeStateStatus(state);
      return {
        ...state,
        ...computed,
      };
    });
  },

  async getStateByCode(code: string): Promise<StateWithComputedStatus | null> {
    const state = await db.getState(code);
    if (!state) return null;
    return {
      ...state,
      ...computeStateStatus(state),
    };
  },

  async getTodayStatus(stateCode?: string) {
    const allStates = await this.getAllStates();
    const activeSelfEnum = allStates.filter((s) => s.status === "active_self_enum");
    const activeHlo = allStates.filter((s) => s.status === "active_hlo");
    const activePe = allStates.filter((s) => s.status === "active_pe");
    const snowBoundStates = allStates.filter((s) => s.is_snow_bound);

    let targetState = stateCode ? allStates.find((s) => s.code.toUpperCase() === stateCode.toUpperCase()) : null;
    if (!targetState && allStates.length > 0) {
      targetState = allStates[0];
    }

    return {
      referenceDate: "2027-03-01",
      snowBoundReferenceDate: "2026-10-01",
      counts: {
        totalStatesAndUTs: allStates.length,
        activeSelfEnumCount: activeSelfEnum.length,
        activeHloCount: activeHlo.length,
        activePeCount: activePe.length,
        snowBoundCount: snowBoundStates.length,
      },
      activeStates: {
        selfEnumeration: activeSelfEnum.map((s) => ({ code: s.code, name: s.name, daysRemaining: s.daysRemaining })),
        houseListing: activeHlo.map((s) => ({ code: s.code, name: s.name, daysRemaining: s.daysRemaining })),
        populationEnumeration: activePe.map((s) => ({ code: s.code, name: s.name, daysRemaining: s.daysRemaining })),
      },
      selectedState: targetState,
    };
  },

  async updateStateSchedule(code: string, updates: Partial<StateData>): Promise<StateData | null> {
    return db.updateState(code, updates);
  },
};
