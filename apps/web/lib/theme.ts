import type { Element } from "@genshin/types";

export const ELEMENTS = ["pyro","hydro","electro","cryo","anemo","geo","dendro","physical"] as const;
export type Skin = "dark" | "vision";
export const SKINS = ["dark","vision"] as const;
export const DEFAULT_SKIN: Skin = "dark";

export interface ElementAccent { accent: string; accent2: string; glow: string; gradient: string; }

// accent = primary, accent2 = lighter highlight, glow = rgba for shadows/glow.
const MAP: Record<Element, ElementAccent> = {
  pyro:     { accent:"#ff7a45", accent2:"#ffb36b", glow:"rgba(255,122,69,.35)",  gradient:"linear-gradient(150deg,#3a1012,#7d241a 55%,#c0492c)" },
  hydro:    { accent:"#3aa0ff", accent2:"#7fc3ff", glow:"rgba(58,160,255,.35)",  gradient:"linear-gradient(150deg,#0d1c33,#13407a 55%,#2f72c0)" },
  electro:  { accent:"#b06bff", accent2:"#d2adff", glow:"rgba(176,107,255,.35)", gradient:"linear-gradient(150deg,#1e1233,#3f1f6e 55%,#6a3fc0)" },
  cryo:     { accent:"#7fe3ff", accent2:"#b8f1ff", glow:"rgba(127,227,255,.32)", gradient:"linear-gradient(150deg,#10262e,#1f5566 55%,#3f9bb0)" },
  anemo:    { accent:"#5fe0bf", accent2:"#9defd6", glow:"rgba(95,224,191,.32)",  gradient:"linear-gradient(150deg,#0f2a26,#1f5a4f 55%,#3fb0a0)" },
  geo:      { accent:"#f6c14b", accent2:"#ffd97a", glow:"rgba(246,193,75,.34)",  gradient:"linear-gradient(150deg,#2e2410,#6b521f 55%,#b08a3a)" },
  dendro:   { accent:"#7ab33a", accent2:"#a8d96a", glow:"rgba(122,179,58,.32)",  gradient:"linear-gradient(150deg,#1a260f,#3f5a1f 55%,#6fa03f)" },
  physical: { accent:"#c9ccd6", accent2:"#e6e8ef", glow:"rgba(201,204,214,.3)",  gradient:"linear-gradient(150deg,#1c1e24,#3a3d47 55%,#6a6e7a)" },
};

export function elementAccent(el: Element): ElementAccent {
  return MAP[el] ?? MAP.physical;
}
