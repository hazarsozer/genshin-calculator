/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Currently EMPTY: prune (9th GO-gated; anemo catalyst; VV/Swirl support) was promoted to characters/ on
 * 2026-06-18, joining nefer (2026-06-17) and durin + jahoda + zibai + illuga + varka + linnea + nicole
 * (2026-06-18). The remaining documented v6 char (Lohen) is BLOCKED — GO has no sheet for her yet (stats
 * only); see tools/port/live-chars.json. New chars stage here as they're gated. */
export {};
