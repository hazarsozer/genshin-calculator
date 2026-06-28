// Maps a character slug (DbObjectChar.name, snake_case) to the HoYo/Enka
// internal art id used by the public CDNs. Unknown ids still resolve to a URL
// — the <img> falls back to a gradient if the asset 404s.
//
// Resolution order for chars:
//   1. CHAR_ICON (generated table, 113/121 chars covered — covers all current chars)
//   2. ART_OVERRIDES (kept as safety net for any future gaps)
//   3. PascalCase heuristic (last resort; 404s degrade to gradient)

import { CHAR_ICON, WEAPON_ICON } from "@genshin/data";

const ART_OVERRIDES: Record<string, string> = {
  hu_tao: "Hutao",
  raiden_shogun: "Shougun",
  yae_miko: "Yae",
  kamisato_ayaka: "Ayaka",
  kamisato_ayato: "Ayato",
  kaedehara_kazuha: "Kazuha",
  sangonomiya_kokomi: "Kokomi",
  arataki_itto: "Itto",
  shikanoin_heizou: "Heizo",
  kuki_shinobu: "Shinobu",
  kujou_sara: "Sara",
  yun_jin: "Yunjin",
  lan_yan: "Lanyan",
  yumemizuki_mizuki: "Mizuki",
  yanfei: "Feiyan",
  noelle: "Noel",
  amber: "Ambor",
  jean: "Qin",
  lisa: "Lisa",
  lyney: "Liney",
  alhaitham: "Alhatham",
  yae: "Yae",
  // Traveler variants all share the PlayerBoy CDN asset (gender toggle out of scope)
  traveler_anemo: "PlayerBoy",
  traveler_geo: "PlayerBoy",
  traveler_electro: "PlayerBoy",
  traveler_dendro: "PlayerBoy",
  traveler_hydro: "PlayerBoy",
  traveler_pyro: "PlayerBoy",
};

function artId(name: string): string {
  if (CHAR_ICON[name]) return CHAR_ICON[name];
  if (ART_OVERRIDES[name]) return ART_OVERRIDES[name];
  // single-token slug → capitalize first letter (bennett → Bennett)
  if (!name.includes("_")) return name.charAt(0).toUpperCase() + name.slice(1);
  // multi-token fallback → PascalCase (best effort; 404s degrade to gradient)
  return name
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function splashSources(name: string): readonly string[] {
  const id = artId(name);
  return [
    `https://enka.network/ui/UI_Gacha_AvatarImg_${id}.png`,
    `https://gi.yatta.moe/assets/UI/UI_Gacha_AvatarImg_${id}.png`,
  ];
}

export function avatarIconSources(name: string): readonly string[] {
  const id = artId(name);
  return [
    `https://enka.network/ui/UI_AvatarIcon_${id}.png`,
    `https://gi.yatta.moe/assets/UI/UI_AvatarIcon_${id}.png`,
  ];
}

// Empirically verified (2026-06-28 curl): polearm icons use "Pole", not "Polearm".
const WEAPON_TYPE_TOKEN: Record<string, string> = {
  sword: "Sword",
  claymore: "Claymore",
  polearm: "Pole",
  catalyst: "Catalyst",
  bow: "Bow",
};

export function weaponIconSources(weapon: { name: string; weapon: string }): readonly string[] {
  // Hit path: use the full icon name from the generated table directly.
  const fullIcon = WEAPON_ICON[weapon.name];
  if (fullIcon) {
    return [
      `https://enka.network/ui/${fullIcon}.png`,
      `https://gi.yatta.moe/assets/UI/${fullIcon}.png`,
    ];
  }
  // Fallback: reconstruct from type token + PascalCase heuristic.
  const type =
    WEAPON_TYPE_TOKEN[weapon.weapon] ??
    (weapon.weapon.charAt(0).toUpperCase() + weapon.weapon.slice(1));
  const id = artId(weapon.name);
  return [
    `https://enka.network/ui/UI_EquipIcon_${type}_${id}.png`,
    `https://gi.yatta.moe/assets/UI/UI_EquipIcon_${type}_${id}.png`,
  ];
}
