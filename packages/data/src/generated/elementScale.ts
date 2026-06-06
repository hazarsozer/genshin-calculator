/**
 * Element-scale level tables — ported verbatim from her generated constants.
 *
 * `reactionShieldValues` is the per-character-level base for the Crystallize shield
 * (`FeatureReactionCrystallize`): `getValue(charLevel)` yields the level term that the
 * mastery curve + shield bonus multiply (P3.5.3). 90 entries, 1-indexed by char level
 * (level 1 → entry 0; clamps like every StatTable).
 *
 * NEVER hand-edit the values — they are a verbatim copy of raw. `reactionDamageValues`
 * (the transformative-reaction level table) is baked into `@genshin/core` already and
 * is intentionally NOT duplicated here.
 *
 * Source: raw/genshin_calc_pub/src/js/db/generated/ElementScale.js:16 (reactionShieldValues)
 */

import { StatTable } from "@genshin/core";

export const reactionShieldValues = new StatTable([
  91.1791, 98.7077, 106.2362, 113.7648, 121.2933, 128.8219, 136.3504, 143.879, 151.4075, 158.9361,
  169.9915, 181.0762, 192.1904, 204.0482, 215.939, 227.8627, 247.6859, 267.5421, 287.4312, 303.8264,
  320.2252, 336.6276, 352.3193, 368.0109, 383.7025, 394.4324, 405.1815, 415.9499, 426.7376, 437.5447,
  450.6, 463.7003, 476.8456, 491.1275, 502.5546, 514.0121, 531.4096, 549.9796, 568.5849, 584.9965,
  605.6703, 626.3862, 646.0523, 665.7556, 685.4961, 700.8394, 723.3331, 745.8653, 768.4357, 786.7919,
  809.5388, 832.329, 855.1627, 878.0396, 899.4848, 919.362, 946.0396, 974.7642, 1003.5786, 1030.077,
  1056.635, 1085.2463, 1113.9244, 1149.2587, 1178.0648, 1200.2238, 1227.6603, 1257.243, 1284.9174, 1314.7529,
  1342.6652, 1372.7524, 1396.321, 1427.3124, 1458.3745, 1482.3358, 1511.9109, 1541.5493, 1569.1537, 1596.8143,
  1622.4197, 1648.074, 1666.3761, 1684.6782, 1702.9803, 1726.1047, 1754.6715, 1785.8666, 1817.1375, 1851.0603,
]);
