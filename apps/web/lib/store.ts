import { create } from "zustand";
import type { BuildForm } from "./types";
import { DEFAULT_FORM } from "./defaults";
import { type Skin, DEFAULT_SKIN } from "./theme";

interface BuildState {
  form: BuildForm;
  setForm: (patch: Partial<BuildForm>) => void;
  /** Replaces `form` wholesale — unlike `setForm`, does NOT merge over the
   * previous form, so optional fields absent from `form` are actually cleared. */
  replaceForm: (form: BuildForm) => void;
  reset: () => void;
}

export const useBuildStore = create<BuildState>()((set) => ({
  form: DEFAULT_FORM,
  setForm: (patch) =>
    set((state) => ({ form: { ...state.form, ...patch } })),
  replaceForm: (form) => set({ form }),
  reset: () => set({ form: DEFAULT_FORM }),
}));

interface SkinState {
  skin: Skin;
  setSkin: (skin: Skin) => void;
}

const SKIN_KEY = "ck-skin";

function parseSkin(value: string | null): Skin {
  return value === "vision" ? "vision" : DEFAULT_SKIN;
}

export const useSkinStore = create<SkinState>()((set) => ({
  skin: DEFAULT_SKIN, // SSR-safe; hydrated from localStorage in ThemeRoot on mount
  setSkin: (skin) => {
    if (typeof window !== "undefined") localStorage.setItem(SKIN_KEY, skin);
    set({ skin });
  },
}));

/** Read the persisted skin from localStorage (call client-side only). */
export function readStoredSkin(): Skin {
  if (typeof window === "undefined") return DEFAULT_SKIN;
  return parseSkin(localStorage.getItem(SKIN_KEY));
}
