/** Transient staging barrel — past-v5.8 chars being gated vs GCSim before promotion. Empty when no
 * char is mid-gating. NOT globbed by the vitest suites (they glob characters/*.ts); the gate's
 * _port-entry.ts merges this for resolution, so promoted chars resolve from characters/ and this is a
 * no-op. (Flins promoted to characters/ in sub-project D — see tools/port/LIVE-CHARS.md.)
 *
 * Currently staging: lauma (KP-L lockstep, gating vs GCSim before promotion). */
export { lauma } from "./lauma.js";
