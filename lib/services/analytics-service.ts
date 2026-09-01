import { ALL_STATES, StateData } from "../db/seed-data";

export interface HistoricalTrendPoint {
  year: number;
  censusNumber: string;
  populationCrores: number;
  literacyRate: number;
  sexRatio: number;
  urbanPct: number;
}

export const HISTORICAL_CENSUS_TRENDS: HistoricalTrendPoint[] = [
  { year: 1951, censusNumber: "9th (1st post-independence)", populationCrores: 36.1, literacyRate: 18.3, sexRatio: 946, urbanPct: 17.3 },
  { year: 1961, censusNumber: "10th", populationCrores: 43.9, literacyRate: 28.3, sexRatio: 941, urbanPct: 18.0 },
  { year: 1971, censusNumber: "11th", populationCrores: 54.8, literacyRate: 34.5, sexRatio: 930, urbanPct: 19.9 },
  { year: 1981, censusNumber: "12th", populationCrores: 68.3, literacyRate: 43.6, sexRatio: 934, urbanPct: 23.3 },
  { year: 1991, censusNumber: "13th", populationCrores: 84.6, literacyRate: 52.2, sexRatio: 927, urbanPct: 25.7 },
  { year: 2001, censusNumber: "14th", populationCrores: 102.8, literacyRate: 64.8, sexRatio: 933, urbanPct: 27.8 },
  { year: 2011, censusNumber: "15th (Official Benchmark)", populationCrores: 121.0, literacyRate: 74.0, sexRatio: 943, urbanPct: 31.2 },
  { year: 2027, censusNumber: "16th (1st Digital Census - Est.)", populationCrores: 144.2, literacyRate: 85.5, sexRatio: 955, urbanPct: 37.5 },
];

export const analyticsService = {
  getNationalSummary() {
    const totalPop2011 = ALL_STATES.reduce((acc, s) => acc + s.population_2011, 0);
    const projected2027 = ALL_STATES.reduce((acc, s) => acc + s.projected_pop_2027, 0);
    const avgLiteracy2011 = (ALL_STATES.reduce((acc, s) => acc + s.literacy_rate_2011, 0) / ALL_STATES.length).toFixed(1);
    const avgSexRatio2011 = Math.round(ALL_STATES.reduce((acc, s) => acc + s.sex_ratio_2011, 0) / ALL_STATES.length);
    const avgElectricity = (ALL_STATES.reduce((acc, s) => acc + s.electricity_pct, 0) / ALL_STATES.length).toFixed(1);
    const avgLpg = (ALL_STATES.reduce((acc, s) => acc + s.lpg_pct, 0) / ALL_STATES.length).toFixed(1);
    const avgTapWater = (ALL_STATES.reduce((acc, s) => acc + s.tap_water_pct, 0) / ALL_STATES.length).toFixed(1);

    return {
      censusNumber: "16th Census of India (Digital Census 2027)",
      approvedBudget: "₹11,718.24 Crore",
      officialDataNotice: "Official historical benchmark: Census 2011 (Registrar General & Census Commissioner of India). 2027 indicators are official demographic projections.",
      totals: {
        population2011: totalPop2011,
        projectedPopulation2027: projected2027,
        nationalLiteracyRate2011: Number(avgLiteracy2011),
        nationalSexRatio2011: avgSexRatio2011,
        householdElectricityAccess2011: Number(avgElectricity),
        householdLpgAccess2011: Number(avgLpg),
        householdTapWaterAccess2011: Number(avgTapWater),
      },
      digitalCensusHighlights: [
        "100% digital data collection on secure tablets & web portal",
        "15-day pre-HLO self-enumeration window in 16 languages",
        "First Caste Census enumeration since 1931 in Phase II",
        "Zero paper wastage; estimated 6,000 tonnes of paper saved",
      ],
    };
  },

  getStateAnalytics(stateCode: string) {
    const state = ALL_STATES.find((s) => s.code.toUpperCase() === stateCode.toUpperCase());
    if (!state) return null;

    return {
      state,
      amenitiesComparison: [
        { metric: "Electricity Access", statePct: state.electricity_pct, nationalAvg: 67.2 },
        { metric: "Clean LPG Fuel", statePct: state.lpg_pct, nationalAvg: 28.5 },
        { metric: "Tap Water Connection", statePct: state.tap_water_pct, nationalAvg: 43.5 },
        { metric: "Latrine within Premises", statePct: state.latrine_pct, nationalAvg: 46.9 },
      ],
    };
  },

  getTrends(metric: "population" | "literacy" | "sexratio" | "urban" = "population") {
    return {
      metric,
      trends: HISTORICAL_CENSUS_TRENDS,
    };
  },

  compareHouseholdWithAverages(stateCode: string, householdData: Record<string, any>) {
    const state = ALL_STATES.find((s) => s.code.toUpperCase() === stateCode.toUpperCase()) || ALL_STATES[0];

    const hasElectricity = householdData.lightingSource === "electricity";
    const hasLpg = householdData.cookingFuel === "lpg_png" || householdData.kitchenStatus === "cooking_inside_lpg";
    const hasPipedWater = householdData.waterSource === "tap_treated" || householdData.waterSource === "tap_untreated";
    const hasLatrine = householdData.latrineAccess === "within_premises";
    const hasInternet = householdData.hasInternet === "yes" || householdData.laptopStatus === "laptop_with_internet";

    return {
      stateName: state.name,
      metrics: [
        {
          name: "Electricity Access",
          yourHousehold: hasElectricity ? "Yes (Grid)" : "No / Solar / Other",
          stateAverage: `${state.electricity_pct}% of households`,
          status: hasElectricity ? "aligned" : "below",
        },
        {
          name: "Clean Cooking Fuel (LPG/PNG)",
          yourHousehold: hasLpg ? "Yes (Clean LPG/PNG)" : "Solid Biomass / Other",
          stateAverage: `${state.lpg_pct}% of households`,
          status: hasLpg ? "aligned" : "below",
        },
        {
          name: "Tap Water Supply",
          yourHousehold: hasPipedWater ? "Yes (Piped Tap)" : "Well / Handpump / Other",
          stateAverage: `${state.tap_water_pct}% of households`,
          status: hasPipedWater ? "aligned" : "below",
        },
        {
          name: "Latrine within Premises",
          yourHousehold: hasLatrine ? "Yes" : "Community / Open",
          stateAverage: `${state.latrine_pct}% of households`,
          status: hasLatrine ? "aligned" : "below",
        },
        {
          name: "Internet Connectivity",
          yourHousehold: hasInternet ? "Yes (Active Internet)" : "No Internet",
          stateAverage: "55.8% (2026 Telecom projection)",
          status: hasInternet ? "aligned" : "below",
        },
      ],
    };
  },
};
