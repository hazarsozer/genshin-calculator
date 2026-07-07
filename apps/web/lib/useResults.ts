'use client';

/**
 * useResults — memoized hook that derives a ComputeResult from the current form.
 *
 * Branches on `form.artifactMode`:
 *   "good"   → assembleFromGood(form.goodJson)  — propagates parse errors into ComputeResult
 *   "manual" → assembleFromManual(form.manualStats, form.manualSets)
 *
 * Then calls computeBuild(form, statBlock, setBonuses). The result is recomputed
 * via useMemo on any change to `form` (the whole object is the dependency because
 * it's a stable reference from Zustand's shallow-merge — any setForm call produces
 * a new object reference, triggering recomputation).
 */

import { useMemo } from 'react';
import { useBuildStore } from './store';
import { assembleFromGood, assembleFromManual } from './artifacts';
import { computeBuild } from './calc';
import type { ComputeResult } from './types';

export function useResults(): ComputeResult {
  const form = useBuildStore((s) => s.form);

  return useMemo((): ComputeResult => {
    if (form.artifactMode === 'good') {
      const { statBlock, setBonuses, error } = assembleFromGood(form.goodJson);
      if (error) {
        return { features: [], error };
      }
      return computeBuild(form, statBlock, setBonuses);
    } else {
      const { statBlock, setBonuses } = assembleFromManual(
        form.manualStats,
        form.manualSets
      );
      return computeBuild(form, statBlock, setBonuses);
    }
  }, [form]);
}
