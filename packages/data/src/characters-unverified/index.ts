/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Currently STAGING: nicole (8th GO-gated; pyro catalyst; off-field ATK-buffer/shielder — FIRST live-char
 * shield gate). Promoted so far: nefer (2026-06-17) and durin + jahoda + zibai + illuga + varka + linnea
 * (2026-06-18). The remaining v6 chars (Prune/… — see tools/port/live-chars.json) stage here as they're gated. */
export { nicole } from "./nicole.js";
