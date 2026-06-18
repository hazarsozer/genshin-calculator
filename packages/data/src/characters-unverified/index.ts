/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Currently STAGING zibai (4th GO-gated; geo sword; DEF-scaling + Lunar-Crystallize). nefer (2026-06-17),
 * durin + jahoda (2026-06-18) were already promoted to characters/. The remaining v6 chars (Illuga/Varka/…
 * — see tools/port/live-chars.json) stage here as they're gated. */
export { zibai } from "./zibai.js";
