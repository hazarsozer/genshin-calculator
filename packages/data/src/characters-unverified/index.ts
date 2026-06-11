/** Transient staging barrel — past-v5.8 chars being gated vs GCSim before promotion. Empty when no
 * char is mid-gating. NOT globbed by the vitest suites (they glob characters/*.ts); the gate's
 * _port-entry.ts merges this for resolution, so promoted chars resolve from characters/ and this is a
 * no-op. (Flins promoted to characters/ in sub-project D; Lauma promoted in the KP-L lockstep — see
 * tools/port/LIVE-CHARS.md.) Empty again — no char mid-gating. */
export {};
