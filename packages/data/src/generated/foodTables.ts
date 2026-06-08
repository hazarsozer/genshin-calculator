// GENERATED — do not edit by hand; regenerate via: node tools/port/gen-tables.mjs
/**
 * Food (cooking-buff) flat-stat tables — all 43 items across 3 types.
 *
 * Each item exposes its raw StatTable value arrays (one per stat key); the food
 * stat is a TIER index (1-based). `getFoodValue` / `getFoodStats` replicate
 * Aspirine's StatTable.getValue + DbObjectFood.getStats exactly.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Food/{Attack,Defence,Potion}.js
 */

export interface FoodItem {
  readonly type: string;
  readonly key: string;
  readonly serializeId: number;
  /** Aspirine-native stat key -> the StatTable.values array (indexed by TIER). */
  readonly stats: Readonly<Record<string, readonly number[]>>;
}

export const foodTables: Readonly<Record<string, Readonly<Record<string, FoodItem>>>> = {
  "Attack": {
    "AdeptusTemptation": {
      type: "Attack",
      key: "AdeptusTemptation",
      serializeId: 1,
      stats: {
      "atk": [260, 316, 372],
      "crit_rate": [8, 10, 12],
      },
    },
    "ChickenTofuPudding": {
      type: "Attack",
      key: "ChickenTofuPudding",
      serializeId: 2,
      stats: {
      "atk": [224, 272, 320],
      "crit_rate": [6, 8, 10],
      },
    },
    "TianshuMeat": {
      type: "Attack",
      key: "TianshuMeat",
      serializeId: 3,
      stats: {
      "dmg_phys": [25, 35, 45],
      "crit_rate": [6, 8, 10],
      },
    },
    "AdventurersBreakfastSandwich": {
      type: "Attack",
      key: "AdventurersBreakfastSandwich",
      serializeId: 4,
      stats: {
      "atk": [160, 194, 228],
      },
    },
    "ColdCutPlatter": {
      type: "Attack",
      key: "ColdCutPlatter",
      serializeId: 5,
      stats: {
      "dmg_phys": [20, 30, 40, 55],
      },
    },
    "PileEmUp": {
      type: "Attack",
      key: "PileEmUp",
      serializeId: 6,
      stats: {
      "crit_rate": [10, 15, 20, 20],
      "crit_dmg": [0, 0, 0, 20],
      },
    },
    "NoTomorrow": {
      type: "Attack",
      key: "NoTomorrow",
      serializeId: 9,
      stats: {
      "crit_rate": [0, 0, 0, 20],
      "crit_dmg": [0, 0, 0, 20],
      },
    },
    "AlmondTofu": {
      type: "Attack",
      key: "AlmondTofu",
      serializeId: 7,
      stats: {
      "atk": [66, 81, 95, 114],
      },
    },
    "JueyunChiliChicken": {
      type: "Attack",
      key: "JueyunChiliChicken",
      serializeId: 8,
      stats: {
      "crit_rate": [6, 8, 12, 16],
      },
    },
    "RockinRiffinChicken": {
      type: "Attack",
      key: "RockinRiffinChicken",
      serializeId: 10,
      stats: {
      "crit_rate": [0, 0, 0, 16],
      },
    },
    "HeartstringNoodles": {
      type: "Attack",
      key: "HeartstringNoodles",
      serializeId: 11,
      stats: {
      "atk": [0, 0, 0, 274],
      },
    },
    "OnlyTruth": {
      type: "Attack",
      key: "OnlyTruth",
      serializeId: 12,
      stats: {
      "atk": [0, 0, 0, 114],
      },
    },
    "ShowMeTheMora": {
      type: "Attack",
      key: "ShowMeTheMora",
      serializeId: 14,
      stats: {
      "atk": [0, 0, 0, 274],
      },
    },
    "Baklava": {
      type: "Attack",
      key: "Baklava",
      serializeId: 15,
      stats: {
      "crit_rate": [10, 15, 20],
      },
    },
    "QingceHouseholdDish": {
      type: "Attack",
      key: "QingceHouseholdDish",
      serializeId: 16,
      stats: {
      "atk": [0, 0, 0, 274],
      },
    },
    "SurveyorsBreakfastSandwich": {
      type: "Attack",
      key: "SurveyorsBreakfastSandwich",
      serializeId: 17,
      stats: {
      "atk": [0, 0, 0, 274],
      },
    },
    "CubicTricks": {
      type: "Attack",
      key: "CubicTricks",
      serializeId: 18,
      stats: {
      "crit_rate": [0, 0, 0, 20],
      "crit_dmg": [0, 0, 0, 20],
      },
    },
    "ConsommePurete": {
      type: "Attack",
      key: "ConsommePurete",
      serializeId: 19,
      stats: {
      "crit_rate": [0, 0, 0, 20],
      "crit_dmg": [0, 0, 0, 20],
      },
    },
    "HymnOfGatheredFlame": {
      type: "Attack",
      key: "HymnOfGatheredFlame",
      serializeId: 20,
      stats: {
      "crit_rate": [0, 0, 0, 20],
      "crit_dmg": [0, 0, 0, 20],
      },
    },
    "MtMushroom": {
      type: "Attack",
      key: "MtMushroom",
      serializeId: 21,
      stats: {
      "crit_rate": [0, 0, 0, 16],
      },
    },
    "GateauDebordMagnifique": {
      type: "Attack",
      key: "GateauDebordMagnifique",
      serializeId: 22,
      stats: {
      "atk": [0, 0, 0, 384],
      "crit_rate": [0, 0, 0, 14],
      },
    },
    "VerdantGift": {
      type: "Attack",
      key: "VerdantGift",
      serializeId: 23,
      stats: {
      "atk": [0, 0, 0, 320],
      "crit_rate": [0, 0, 0, 10],
      },
    },
    "GildedHall": {
      type: "Attack",
      key: "GildedHall",
      serializeId: 24,
      stats: {
      "atk": [0, 0, 0, 372],
      "crit_dmg": [0, 0, 0, 24],
      },
    },
  },
  "Defence": {
    "ButterCrab": {
      type: "Defence",
      key: "ButterCrab",
      serializeId: 1,
      stats: {
      "def": [215, 261, 308],
      "healing": [6, 8, 10],
      },
    },
    "CallaLilySeafoodSoup": {
      type: "Defence",
      key: "CallaLilySeafoodSoup",
      serializeId: 2,
      stats: {
      "def": [165, 200, 235, 282],
      },
    },
    "ChiliMinceCornbreadBuns": {
      type: "Defence",
      key: "ChiliMinceCornbreadBuns",
      serializeId: 3,
      stats: {
      "shield": [25, 30, 35, 40],
      "def": [165, 200, 235, 282],
      },
    },
    "FishermansToast": {
      type: "Defence",
      key: "FishermansToast",
      serializeId: 4,
      stats: {
      "def": [88, 107, 126, 151],
      },
    },
    "SakuraTempura": {
      type: "Defence",
      key: "SakuraTempura",
      serializeId: 5,
      stats: {
      "shield": [20, 25, 30, 35],
      },
    },
    "SakuraShrimpCrackers": {
      type: "Defence",
      key: "SakuraShrimpCrackers",
      serializeId: 6,
      stats: {
      "hp_percent": [20, 22, 25],
      },
    },
    "UnagiChazuke": {
      type: "Defence",
      key: "UnagiChazuke",
      serializeId: 7,
      stats: {
      "healing": [15, 17, 20, 25],
      },
    },
    "QuietElegance": {
      type: "Defence",
      key: "QuietElegance",
      serializeId: 8,
      stats: {
      "shield": [0, 0, 0, 35],
      },
    },
    "ForestWatchersChoice": {
      type: "Defence",
      key: "ForestWatchersChoice",
      serializeId: 9,
      stats: {
      "def": [0, 0, 0, 151],
      },
    },
    "GoldflameTajine": {
      type: "Defence",
      key: "GoldflameTajine",
      serializeId: 10,
      stats: {
      "hp_percent": [0, 0, 0, 30],
      },
    },
    "ALeisurelySip": {
      type: "Defence",
      key: "ALeisurelySip",
      serializeId: 11,
      stats: {
      "healing": [0, 0, 0, 25],
      },
    },
    "CheesyCrabHotpot": {
      type: "Defence",
      key: "CheesyCrabHotpot",
      serializeId: 12,
      stats: {
      "hp_percent": [20, 25, 30],
      "recharge": [14, 17, 20],
      },
    },
    "EmotionalSupport": {
      type: "Defence",
      key: "EmotionalSupport",
      serializeId: 13,
      stats: {
      "def": [0, 0, 0, 282],
      },
    },
  },
  "Potion": {
    "FlamingEssentialOil": {
      type: "Potion",
      key: "FlamingEssentialOil",
      serializeId: 1,
      stats: {
      "dmg_pyro": [25],
      },
    },
    "FrostingEssentialOil": {
      type: "Potion",
      key: "FrostingEssentialOil",
      serializeId: 2,
      stats: {
      "dmg_cryo": [25],
      },
    },
    "GushingEssentialOil": {
      type: "Potion",
      key: "GushingEssentialOil",
      serializeId: 3,
      stats: {
      "dmg_anemo": [25],
      },
    },
    "ShockingEssentialOil": {
      type: "Potion",
      key: "ShockingEssentialOil",
      serializeId: 4,
      stats: {
      "dmg_electro": [25],
      },
    },
    "StreamingEssentialOil": {
      type: "Potion",
      key: "StreamingEssentialOil",
      serializeId: 5,
      stats: {
      "dmg_hydro": [25],
      },
    },
    "UnmovingEssentialOil": {
      type: "Potion",
      key: "UnmovingEssentialOil",
      serializeId: 6,
      stats: {
      "dmg_geo": [25],
      },
    },
    "ForestEssentialOil": {
      type: "Potion",
      key: "ForestEssentialOil",
      serializeId: 7,
      stats: {
      "dmg_dendro": [25],
      },
    },
  },
};

/**
 * Replicate Aspirine's StatTable.getValue (raw/.../classes/StatTable.js:11-20):
 * `level` is a 1-indexed TIER — clamp-to-last when above range, 0 when <= 0.
 */
export function getFoodValue(values: readonly number[], tier: number): number {
  if (tier > 0) {
    const idx = tier > values.length ? values.length : tier;
    return values[idx - 1] ?? 0;
  }
  return 0;
}

/**
 * Replicate DbObjectFood.getStats(tier) (raw/.../classes/DbObject/Food.js:96-109):
 * for each stat key, take the tier value and add it to the bag IFF non-zero (her
 * `if (value)` skip). Returns the food's flat-stat contribution (Aspirine-native keys).
 */
export function getFoodStats(
  type: string,
  key: string,
  tier: number
): Readonly<Record<string, number>> {
  const item = foodTables[type]?.[key];
  if (!item) throw new Error(`Unknown food item: ${type}/${key}`);
  const out: Record<string, number> = {};
  for (const [stat, values] of Object.entries(item.stats)) {
    const value = getFoodValue(values, tier);
    if (value) out[stat] = value;
  }
  return out;
}
