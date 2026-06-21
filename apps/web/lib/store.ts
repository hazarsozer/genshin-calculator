import { create } from "zustand";
import type { BuildForm } from "./types";
import { DEFAULT_FORM } from "./defaults";

interface BuildState {
  form: BuildForm;
  setForm: (patch: Partial<BuildForm>) => void;
  reset: () => void;
}

export const useBuildStore = create<BuildState>()((set) => ({
  form: DEFAULT_FORM,
  setForm: (patch) =>
    set((state) => ({ form: { ...state.form, ...patch } })),
  reset: () => set({ form: DEFAULT_FORM }),
}));
