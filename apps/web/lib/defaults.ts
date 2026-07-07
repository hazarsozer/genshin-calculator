import type { BuildForm } from "./types";

export const DEFAULT_FORM: BuildForm = {
  characterKey: "bennett",
  weaponKey: "dark_iron_sword",
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
  talents: { attack: 10, elemental: 10, burst: 10 },
  constellation: 0,
  weaponRefine: 1,
  conditions: {
    toggles: {},
    stacks: {},
  },
  enemy: { level: 90, resistance: 10 },
  artifactMode: "manual",
  goodJson: "",
  manualStats: {},
  manualSets: [],
  party: { members: [] },
};
