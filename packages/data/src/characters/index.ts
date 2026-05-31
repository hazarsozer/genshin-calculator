/**
 * P1.7b representative character set.
 *
 * Exports the 4 representatives covering HP / ATK / DEF / Lunar-Charged scaling:
 *   - huTao        (HP scaler, pyro polearm, Blackcliff Pole)
 *   - diluc        (ATK scaler, pyro claymore, The Bell)
 *   - aratakiItto  (DEF scaler, geo claymore, The Bell)
 *   - ineffa       (Lunar-Charged, electro polearm, Blackcliff Pole)
 */

export { huTao } from "./hu-tao.js";
export { diluc } from "./diluc.js";
export { aratakiItto } from "./arataki-itto.js";
export { ineffa } from "./ineffa.js";
export { kaeya } from "./kaeya.js";
export { chongyun } from "./chongyun.js";
// razor.ts exists but is excluded from index pending infra fix (dmg_phys_base)
export { xiangling } from "./xiangling.js";
// amber.ts exists but excluded pending infra fix (critRateBonuses/crit_rate_amber)
