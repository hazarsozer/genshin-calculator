/**
 * The 29 `custom_buffs.<key>` settings the engine's universal manual-buff
 * escape-hatch recognizes (her always-present `ConditionCustomBuffs`,
 * packages/data/src/buildStats.ts:896-899). Values pass through UNSCALED
 * (raw percent points / flats) — the engine folds /100 downstream.
 */
export const CUSTOM_BUFF_KEYS = [
  "atk",
  "atk_percent",
  "def",
  "def_percent",
  "hp",
  "hp_percent",
  "mastery",
  "recharge",
  "crit_rate",
  "crit_dmg",
  "healing",
  "healing_recv",
  "shield",
  "dmg_all",
  "dmg_anemo",
  "dmg_cryo",
  "dmg_dendro",
  "dmg_electro",
  "dmg_geo",
  "dmg_hydro",
  "dmg_pyro",
  "dmg_phys",
  "dmg_normal",
  "dmg_charged",
  "dmg_plunge",
  "dmg_skill",
  "dmg_burst",
  "enemy_def_reduce",
  "enemy_def_ignore",
] as const;

export interface CustomBuffGroup {
  title: string;
  keys: readonly string[];
}

export const CUSTOM_BUFF_GROUPS: CustomBuffGroup[] = [
  { title: "Base Stats", keys: CUSTOM_BUFF_KEYS.slice(0, 13) },
  { title: "Damage Bonus", keys: CUSTOM_BUFF_KEYS.slice(13) },
];
