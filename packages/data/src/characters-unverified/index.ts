/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Mid-gating: nefer — the FIRST GO-gated char (GCSim lacks her); gated via tools/oracle/gate-go.mjs. */
export { nefer } from "./nefer.js";
