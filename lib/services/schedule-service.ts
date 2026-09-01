import { db } from "../db/store";
import { StateData } from "../db/seed-data";
import { computeStateStatus, StateWithComputedStatus, PhaseStatus } from "./schedule-status";

export { computeStateStatus };
export type { StateWithComputedStatus, PhaseStatus };

/**
 * Service managing state-wise timeline computations, active phase filtering,
 * and schedule updates for Census 2027.
 */
export const scheduleService = {
  /**
   * Retrieves all 36 Indian States & UTs with computed real-time phase statuses.
   * @returns Array of states with calculated status and countdown days
   */
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

  /**
   * Retrieves a single state by 2-letter state code with computed status.
   * @param code - 2-letter state code (e.g. "GA", "MH")
   * @returns State record with computed status, or null if not found
   */
  async getStateByCode(code: string): Promise<StateWithComputedStatus | null> {
    const state = await db.getState(code);
    if (!state) return null;
    return {
      ...state,
      ...computeStateStatus(state),
    };
  },

  /**
   * Generates a real-time national Census snapshot including active self-enum counts,
   * active HLO counts, snow-bound counts, and selected state status.
   *
   * @param stateCode - Optional focused state code
   * @returns National and state-specific timeline summary
   */
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

  /**
   * Updates state schedule dates in persistence store.
   * @param code - 2-letter state code
   * @param updates - Partial state fields to update
   * @returns Updated state record
   */
  async updateStateSchedule(code: string, updates: Partial<StateData>): Promise<StateData | null> {
    return db.updateState(code, updates);
  },
};
