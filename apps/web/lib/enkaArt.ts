// Maps a character slug (DbObjectChar.name, snake_case) to the HoYo/Enka
// internal art id used by the public CDNs. Most are first-letter-capitalized;
// irregular internal names need an override. Unknown ids still resolve to a URL
// — the <img> falls back to a gradient if the asset 404s.

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
  yanfei: "Feiyan",
  noelle: "Noel",
  amber: "Ambor",
  jean: "Qin",
  lisa: "Lisa",
  lyney: "Liney",
  alhaitham: "Alhatham",
  yae: "Yae",
};

function artId(name: string): string {
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
