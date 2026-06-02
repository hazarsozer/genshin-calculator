// GENERATED — do not edit by hand; regenerate via: node tools/port/gen-tables.mjs
/**
 * Weapon base-stat tables.
 *
 * Default weapons per type used by the fixed oracle build:
 *   polearm:  BlackcliffPole
 *   claymore: Bell
 *   sword:    AlleyFlash
 *   bow:      AlleyHunter
 *   catalyst: SolarPearl
 *
 * Source: raw/genshin_calc_pub/src/js/db/generated/WeaponStatTables.js
 *         raw/genshin_calc_pub/src/js/db/generated/WeaponScale.js
 */

import { StatTable, StatTableAscensionScale, StatTableAscensionWeapon } from "@genshin/core";
import type { StatTableEntry } from "@genshin/types";

const atk_1_1 = new StatTable([
  1, 1.076, 1.152, 1.228, 1.303, 1.379, 1.454, 1.529, 1.604, 1.679, 1.754,
  1.828, 1.903, 1.977, 2.051, 2.125, 2.199, 2.273, 2.347, 2.42, 2.493, 2.567,
  2.64, 2.713, 2.786, 2.859, 2.931, 3.004, 3.076, 3.148, 3.221, 3.293, 3.365,
  3.437, 3.508, 3.58, 3.652, 3.723, 3.794, 3.866, 3.937, 4.008, 4.079, 4.15,
  4.221, 4.291, 4.362, 4.433, 4.503, 4.574, 4.644, 4.714, 4.784, 4.855, 4.925,
  4.995, 5.065, 5.134, 5.204, 5.274, 5.344, 5.413, 5.483, 5.552, 5.622, 5.691,
  5.761, 5.83, 5.899, 5.968, 6.038, 6.107, 6.176, 6.245, 6.314, 6.383, 6.452,
  6.521, 6.59, 6.659, 6.727, 6.796, 6.865, 6.934, 7.003, 7.071, 7.14, 7.209,
  7.277, 7.346, 7.415, 7.483, 7.552, 7.621, 7.689, 7.758, 7.827, 7.895, 7.964,
  8.033,
]);

const atk_1_2 = new StatTable([
  1, 1.081, 1.162, 1.244, 1.325, 1.407, 1.489, 1.57, 1.652, 1.734, 1.816,
  1.898, 1.981, 2.063, 2.145, 2.227, 2.31, 2.392, 2.474, 2.557, 2.639, 2.722,
  2.804, 2.887, 2.969, 3.052, 3.134, 3.217, 3.299, 3.382, 3.464, 3.547, 3.629,
  3.712, 3.794, 3.877, 3.959, 4.042, 4.124, 4.206, 4.289, 4.371, 4.454, 4.536,
  4.618, 4.701, 4.783, 4.865, 4.948, 5.03, 5.112, 5.194, 5.277, 5.359, 5.441,
  5.523, 5.605, 5.688, 5.77, 5.852, 5.934, 6.016, 6.098, 6.18, 6.262, 6.344,
  6.427, 6.509, 6.591, 6.673, 6.755, 6.837, 6.919, 7.001, 7.083, 7.165, 7.247,
  7.329, 7.411, 7.493, 7.575, 7.657, 7.739, 7.821, 7.904, 7.986, 8.068, 8.15,
  8.232, 8.314, 8.396, 8.478, 8.561, 8.643, 8.725, 8.807, 8.89, 8.972, 9.054,
  9.137,
]);

const atk_1_4 = new StatTable([
  1, 1.071, 1.141, 1.211, 1.28, 1.349, 1.417, 1.486, 1.553, 1.621, 1.688,
  1.754, 1.82, 1.886, 1.952, 2.017, 2.082, 2.147, 2.211, 2.275, 2.339, 2.402,
  2.466, 2.529, 2.591, 2.654, 2.716, 2.778, 2.84, 2.901, 2.962, 3.023, 3.084,
  3.145, 3.205, 3.265, 3.325, 3.385, 3.445, 3.504, 3.564, 3.623, 3.682, 3.741,
  3.799, 3.858, 3.916, 3.974, 4.032, 4.09, 4.148, 4.205, 4.263, 4.32, 4.377,
  4.434, 4.491, 4.548, 4.605, 4.661, 4.718, 4.774, 4.83, 4.887, 4.943, 4.999,
  5.054, 5.11, 5.166, 5.222, 5.277, 5.333, 5.388, 5.443, 5.498, 5.554, 5.609,
  5.664, 5.719, 5.774, 5.828, 5.883, 5.938, 5.993, 6.047, 6.102, 6.156, 6.211,
  6.265, 6.32, 6.374, 6.428, 6.483, 6.537, 6.591, 6.646, 6.7, 6.754, 6.808,
  6.862,
]);

const atk_2_1 = new StatTable([
  1, 1.083, 1.165, 1.248, 1.33, 1.413, 1.495, 1.578, 1.661, 1.743, 1.826,
  1.908, 1.991, 2.073, 2.156, 2.239, 2.321, 2.404, 2.486, 2.569, 2.651, 2.734,
  2.817, 2.899, 2.982, 3.064, 3.147, 3.229, 3.312, 3.394, 3.477, 3.56, 3.642,
  3.725, 3.807, 3.89, 3.972, 4.055, 4.138, 4.22, 4.303, 4.385, 4.468, 4.55,
  4.633, 4.716, 4.798, 4.881, 4.963, 5.046, 5.128, 5.211, 5.294, 5.376, 5.459,
  5.541, 5.624, 5.706, 5.789, 5.872, 5.954, 6.037, 6.119, 6.202, 6.284, 6.367,
  6.45, 6.532, 6.615, 6.697, 6.78, 6.862, 6.945, 7.028, 7.11, 7.193, 7.275,
  7.358, 7.44, 7.523, 7.606, 7.688, 7.771, 7.853, 7.936, 8.018, 8.101, 8.183,
  8.266, 8.349, 8.431, 8.514, 8.596, 8.679, 8.761, 8.844, 8.927, 9.009, 9.092,
  9.174,
]);

const atk_2_2 = new StatTable([
  1, 1.088, 1.176, 1.264, 1.353, 1.442, 1.531, 1.621, 1.71, 1.8, 1.891,
  1.981, 2.072, 2.162, 2.253, 2.345, 2.436, 2.527, 2.619, 2.711, 2.803, 2.895,
  2.987, 3.08, 3.172, 3.265, 3.358, 3.451, 3.544, 3.637, 3.731, 3.824, 3.918,
  4.011, 4.105, 4.199, 4.293, 4.387, 4.481, 4.575, 4.669, 4.763, 4.858, 4.952,
  5.047, 5.142, 5.236, 5.331, 5.426, 5.521, 5.616, 5.711, 5.806, 5.901, 5.996,
  6.092, 6.187, 6.282, 6.378, 6.473, 6.569, 6.664, 6.76, 6.856, 6.951, 7.047,
  7.143, 7.239, 7.335, 7.431, 7.527, 7.623, 7.719, 7.815, 7.911, 8.007, 8.103,
  8.199, 8.296, 8.392, 8.488, 8.585, 8.681, 8.777, 8.874, 8.97, 9.067, 9.163,
  9.26, 9.356, 9.453, 9.55, 9.646, 9.743, 9.84, 9.936, 10.033, 10.13, 10.227,
  10.324,
]);

const atk_2_3 = new StatTable([
  1, 1.093, 1.186, 1.28, 1.374, 1.469, 1.565, 1.661, 1.757, 1.854, 1.952,
  2.049, 2.147, 2.246, 2.345, 2.444, 2.544, 2.644, 2.744, 2.845, 2.946, 3.047,
  3.148, 3.25, 3.352, 3.454, 3.557, 3.66, 3.762, 3.866, 3.969, 4.073, 4.177,
  4.281, 4.385, 4.489, 4.594, 4.699, 4.803, 4.909, 5.014, 5.119, 5.225, 5.33,
  5.436, 5.542, 5.648, 5.755, 5.861, 5.968, 6.074, 6.181, 6.288, 6.395, 6.502,
  6.609, 6.717, 6.824, 6.932, 7.039, 7.147, 7.255, 7.363, 7.471, 7.579, 7.687,
  7.795, 7.904, 8.012, 8.12, 8.229, 8.338, 8.446, 8.555, 8.664, 8.773, 8.882,
  8.991, 9.1, 9.209, 9.319, 9.428, 9.537, 9.647, 9.756, 9.866, 9.975, 10.085,
  10.195, 10.305, 10.414, 10.524, 10.634, 10.744, 10.854, 10.964, 11.074, 11.184, 11.295,
  11.405,
]);

const atk_2_4 = new StatTable([
  1, 1.077, 1.154, 1.23, 1.306, 1.382, 1.457, 1.533, 1.607, 1.682, 1.757,
  1.831, 1.905, 1.979, 2.052, 2.126, 2.199, 2.272, 2.345, 2.417, 2.49, 2.562,
  2.634, 2.707, 2.778, 2.85, 2.922, 2.993, 3.065, 3.136, 3.207, 3.278, 3.349,
  3.42, 3.49, 3.561, 3.632, 3.702, 3.772, 3.842, 3.913, 3.983, 4.053, 4.122,
  4.192, 4.262, 4.332, 4.401, 4.471, 4.54, 4.609, 4.679, 4.748, 4.817, 4.886,
  4.955, 5.024, 5.093, 5.162, 5.231, 5.3, 5.368, 5.437, 5.506, 5.574, 5.643,
  5.711, 5.78, 5.848, 5.916, 5.985, 6.053, 6.121, 6.189, 6.257, 6.326, 6.394,
  6.462, 6.53, 6.598, 6.665, 6.733, 6.801, 6.869, 6.937, 7.005, 7.072, 7.14,
  7.208, 7.275, 7.343, 7.411, 7.478, 7.546, 7.613, 7.681, 7.748, 7.816, 7.883,
  7.95,
]);

const atk_3_1 = new StatTable([
  1, 1.086, 1.171, 1.257, 1.343, 1.429, 1.516, 1.602, 1.689, 1.775, 1.862,
  1.949, 2.036, 2.124, 2.211, 2.299, 2.386, 2.474, 2.562, 2.65, 2.738, 2.827,
  2.915, 3.004, 3.093, 3.182, 3.271, 3.36, 3.45, 3.539, 3.629, 3.719, 3.809,
  3.899, 3.989, 4.08, 4.17, 4.261, 4.352, 4.443, 4.534, 4.625, 4.717, 4.808,
  4.9, 4.992, 5.084, 5.176, 5.268, 5.36, 5.453, 5.546, 5.638, 5.731, 5.825,
  5.918, 6.011, 6.105, 6.198, 6.292, 6.386, 6.48, 6.575, 6.669, 6.763, 6.858,
  6.953, 7.048, 7.143, 7.238, 7.334, 7.429, 7.525, 7.621, 7.717, 7.813, 7.909,
  8.005, 8.102, 8.199, 8.295, 8.392, 8.489, 8.587, 8.684, 8.782, 8.879, 8.977,
  9.075, 9.173, 9.271, 9.37, 9.468, 9.567, 9.666, 9.765, 9.864, 9.963, 10.062,
  10.162,
]);

const atk_3_2 = new StatTable([
  1, 1.091, 1.183, 1.275, 1.368, 1.461, 1.554, 1.648, 1.743, 1.837, 1.933,
  2.028, 2.124, 2.22, 2.317, 2.414, 2.511, 2.608, 2.706, 2.804, 2.903, 3.002,
  3.101, 3.2, 3.3, 3.4, 3.5, 3.601, 3.701, 3.803, 3.904, 4.005, 4.107,
  4.209, 4.312, 4.414, 4.517, 4.62, 4.723, 4.827, 4.931, 5.035, 5.139, 5.243,
  5.348, 5.453, 5.558, 5.663, 5.768, 5.874, 5.98, 6.086, 6.192, 6.299, 6.406,
  6.513, 6.62, 6.727, 6.835, 6.942, 7.05, 7.158, 7.267, 7.375, 7.484, 7.592,
  7.701, 7.811, 7.92, 8.03, 8.139, 8.249, 8.359, 8.47, 8.58, 8.691, 8.802,
  8.913, 9.024, 9.135, 9.247, 9.358, 9.47, 9.582, 9.694, 9.807, 9.919, 10.032,
  10.145, 10.258, 10.371, 10.485, 10.598, 10.712, 10.826, 10.94, 11.054, 11.168, 11.283,
  11.397,
]);

const atk_3_3 = new StatTable([
  1, 1.097, 1.194, 1.292, 1.391, 1.49, 1.591, 1.692, 1.793, 1.895, 1.998,
  2.102, 2.206, 2.31, 2.415, 2.521, 2.627, 2.734, 2.841, 2.949, 3.057, 3.165,
  3.274, 3.384, 3.493, 3.604, 3.714, 3.825, 3.937, 4.049, 4.161, 4.273, 4.386,
  4.499, 4.613, 4.727, 4.841, 4.956, 5.071, 5.186, 5.301, 5.417, 5.533, 5.65,
  5.767, 5.884, 6.001, 6.118, 6.236, 6.354, 6.473, 6.592, 6.71, 6.83, 6.949,
  7.069, 7.189, 7.309, 7.429, 7.55, 7.671, 7.792, 7.913, 8.035, 8.157, 8.279,
  8.401, 8.524, 8.646, 8.769, 8.893, 9.016, 9.14, 9.263, 9.387, 9.512, 9.636,
  9.761, 9.886, 10.011, 10.136, 10.261, 10.387, 10.513, 10.639, 10.765, 10.892, 11.018,
  11.145, 11.272, 11.399, 11.527, 11.654, 11.782, 11.91, 12.038, 12.166, 12.295, 12.424,
  12.552,
]);

const atk_3_4 = new StatTable([
  1, 1.079, 1.159, 1.238, 1.317, 1.395, 1.474, 1.552, 1.631, 1.709, 1.787,
  1.865, 1.942, 2.02, 2.098, 2.175, 2.253, 2.33, 2.408, 2.485, 2.562, 2.639,
  2.717, 2.794, 2.871, 2.948, 3.026, 3.103, 3.18, 3.257, 3.334, 3.412, 3.489,
  3.566, 3.644, 3.721, 3.798, 3.876, 3.953, 4.031, 4.109, 4.186, 4.264, 4.342,
  4.419, 4.497, 4.575, 4.653, 4.731, 4.81, 4.888, 4.966, 5.044, 5.123, 5.201,
  5.28, 5.359, 5.437, 5.516, 5.595, 5.674, 5.753, 5.833, 5.912, 5.991, 6.071,
  6.15, 6.23, 6.31, 6.39, 6.47, 6.55, 6.63, 6.71, 6.791, 6.871, 6.952,
  7.033, 7.113, 7.194, 7.275, 7.357, 7.438, 7.519, 7.601, 7.682, 7.764, 7.846,
  7.928, 8.01, 8.092, 8.174, 8.257, 8.339, 8.422, 8.505, 8.588, 8.671, 8.754,
  8.837,
]);

const crt_3_1 = new StatTable([
  1, 1, 1, 1, 1.162, 1.162, 1.162, 1.162, 1.162, 1.363, 1.363,
  1.363, 1.363, 1.363, 1.565, 1.565, 1.565, 1.565, 1.565, 1.767, 1.767, 1.767,
  1.767, 1.767, 1.969, 1.969, 1.969, 1.969, 1.969, 2.171, 2.171, 2.171, 2.171,
  2.171, 2.373, 2.373, 2.373, 2.373, 2.373, 2.575, 2.575, 2.575, 2.575, 2.575,
  2.777, 2.777, 2.777, 2.777, 2.777, 2.979, 2.979, 2.979, 2.979, 2.979, 3.181,
  3.181, 3.181, 3.181, 3.181, 3.383, 3.383, 3.383, 3.383, 3.383, 3.585, 3.585,
  3.585, 3.585, 3.585, 3.786, 3.786, 3.786, 3.786, 3.786, 3.988, 3.988, 3.988,
  3.988, 3.988, 4.19, 4.19, 4.19, 4.19, 4.19, 4.392, 4.392, 4.392, 4.392,
  4.392, 4.594, 4.594, 4.594, 4.594, 4.594, 4.796, 4.796, 4.796, 4.796, 4.796,
  4.998,
]);

const asc_0 = new StatTable([19.5, 38.9, 58.4, 77.8, 97.3, 116.7]);
const asc_1 = new StatTable([25.9, 51.9, 77.8, 103.7, 129.7, 155.6]);
const asc_2 = new StatTable([31.1, 62.2, 93.4, 124.5, 155.6, 186.7]);

function entry(
  stat: string,
  base: number,
  scale?: StatTable,
  ascension?: StatTable
): StatTableEntry {
  const params = scale !== undefined && ascension !== undefined
    ? { base, scale, ascension }
    : scale !== undefined
      ? { base, scale }
      : ascension !== undefined
        ? { base, ascension }
        : { base };
  const table = new StatTableAscensionScale(params);
  return {
    getName: () => stat,
    getValue: (level: number, asc: number) => table.getValue(level, asc),
  };
}

export const CoolSteelStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("atk_percent", 7.66, crt_3_1),
];

export const HarbingerofDawnStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("crit_dmg_base", 10.2, crt_3_1),
];

export const TravelersHandySwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("def_percent", 6.3733, crt_3_1),
];

export const DarkIronSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("mastery_base", 30.6, crt_3_1),
];

export const FilletBladeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("atk_percent", 7.66, crt_3_1),
];

export const SkyriderSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("recharge_base", 11.3333, crt_3_1),
];

export const FavoniusSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("recharge_base", 13.3333, crt_3_1),
];

export const FluteStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const SacrificialSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("recharge_base", 13.3333, crt_3_1),
];

export const RoyalLongswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const LionsRoarStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const PrototypeRancourStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("dmg_phys_base", 7.5067, crt_3_1),
];

export const IronStingStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const BlackcliffLongswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("crit_dmg_base", 8, crt_3_1),
];

export const BlackSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const AlleyFlashStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.0687, atk_2_3, asc_1),
  entry("mastery_base", 12, crt_3_1),
];

export const SwordofDescensionStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_1),
  entry("atk_percent", 7.66, crt_3_1),
];

export const FesteringDesireStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const AmenomaKageuchiStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const CinnabarSpindleStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("def_percent", 15.0133, crt_3_1),
];

export const KagotsurubeIsshinStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const SapwoodBladeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const XiphosMoonlightStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const ToukabouShigureStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const WolfFangStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const FinaleOfTheDeepStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FleuveCendreFerrymanStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const TheDockhandsAssistantStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const SwordOfNarzissenkreuzStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const SturdyBoneStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FlamebreathFluteStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("def_percent", 15.0133, crt_3_1),
];

export const CalamityOfEshuStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const AquilaFavoniaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("dmg_phys_base", 9, crt_3_1),
];

export const SkywardBladeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("recharge_base", 12, crt_3_1),
];

export const FreedomSwornStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("mastery_base", 43.2, crt_3_1),
];

export const SummitShaperStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const PrimordialJadeCutterStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_rate_base", 9.6, crt_3_1),
];

export const MistsplitterReforgedStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_dmg_base", 9.6, crt_3_1),
];

export const HaranGeppakuFutsuStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_rate_base", 7.2, crt_3_1),
];

export const KeyofKhajNisutStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("hp_percent", 14.4, crt_3_1),
];

export const LightofFoliarIncisionStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const SplendorOfStillWatersStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const UrakuMisugiriStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const AbsolutionStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_dmg_base", 9.6, crt_3_1),
];

export const PeakPatrolSongStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("def_percent", 18, crt_3_1),
];

export const AzurelightStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const FerrousShadowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("hp_percent", 7.66, crt_3_1),
];

export const BloodtaintedGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("mastery_base", 40.8, crt_3_1),
];

export const WhiteIronGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("def_percent", 9.56, crt_3_1),
];

export const DebateClubStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("atk_percent", 7.66, crt_3_1),
];

export const SkyriderGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("dmg_phys_base", 9.56, crt_3_1),
];

export const FavoniusGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("recharge_base", 13.3333, crt_3_1),
];

export const BellStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const SacrificialGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const RoyalGreatswordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const RainslasherStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const PrototypeArchaicStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const WhiteblindStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("def_percent", 11.26, crt_3_1),
];

export const BlackcliffSlasherStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_dmg_base", 12, crt_3_1),
];

export const SerpentSpineStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const LithicBladeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const SnowTombedStarsilverStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("dmg_phys_base", 7.5067, crt_3_1),
];

export const LuxuriousSeaLordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const KatsuragikiriNagamasaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const MakhairaAquamarineStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const AkuoumaruStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const ForestRegaliaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const MailedFlowerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("mastery_base", 24, crt_3_1),
];

export const TalkingStickStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("crit_rate_base", 4, crt_3_1),
];

export const TidalShadowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const MegaMagicSwordStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const PortablePowerSawStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("hp_percent", 12, crt_3_1),
];

export const FruitfulHookStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const EarthshakerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FlameForgedInsightStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const SkywardPrideStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("recharge_base", 8, crt_3_1),
];

export const WolfsGravestoneStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const SongofBrokenPinesStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 49.1377, atk_3_3, asc_2),
  entry("dmg_phys_base", 4.5, crt_3_1),
];

export const UnforgedStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const RedhornStonethresherStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const BeaconOfTheReedSeaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_rate_base", 7.2, crt_3_1),
];

export const VerdictStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const MountainKingsFangStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 49.1377, atk_3_3, asc_2),
  entry("crit_rate_base", 2.4, crt_3_1),
];

export const AThousandBlazingSunsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 49.1377, atk_3_3, asc_2),
  entry("crit_rate_base", 2.4, crt_3_1),
];

export const WhiteTasselStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("crit_rate_base", 5.1, crt_3_1),
];

export const HalberdStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("atk_percent", 5.1067, crt_3_1),
];

export const BlackTasselStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("hp_percent", 10.2133, crt_3_1),
];

export const DragonsBaneStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("mastery_base", 48, crt_3_1),
];

export const PrototypeStarglitterStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const CrescentPikeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("dmg_phys_base", 7.5067, crt_3_1),
];

export const BlackcliffPoleStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_dmg_base", 12, crt_3_1),
];

export const DeathmatchStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("crit_rate_base", 8, crt_3_1),
];

export const LithicSpearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FavoniusLanceStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const RoyalSpearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const DragonspineSpearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("dmg_phys_base", 15.0133, crt_3_1),
];

export const KitainCrossSpearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("mastery_base", 24, crt_3_1),
];

export const CatchStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const WavebreakersFinStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.0687, atk_2_3, asc_1),
  entry("atk_percent", 3, crt_3_1),
];

export const MoonpiercerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("mastery_base", 24, crt_3_1),
];

export const MissiveWindspearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const BalladOfTheFjordsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const RightfulRewardStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("hp_percent", 6, crt_3_1),
];

export const DialoguesOfTheDesertSagesStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const ProspectorsDrillStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const MountainBracingBoltStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const RainbowsTrailStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("def_percent", 11.26, crt_3_1),
];

export const BriefPavilionChatterStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const StaffofHomaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const SkywardSpineStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("recharge_base", 8, crt_3_1),
];

export const VortexVanquisherStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const PrimordialJadeWingedSpearStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const CalamityQuellerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 49.1377, atk_3_3, asc_2),
  entry("atk_percent", 3.6, crt_3_1),
];

export const GrasscuttersLightStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("recharge_base", 12, crt_3_1),
];

export const StaffOfScarletSandsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_rate_base", 9.6, crt_3_1),
];

export const CrimsonMoonsSemblanceStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const LumidouceElegyStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_rate_base", 7.2, crt_3_1),
];

export const SymphonistofScentsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const FracturedHaloStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const MagicGuideStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("mastery_base", 40.8, crt_3_1),
];

export const ThrillingTalesofDragonSlayersStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("hp_percent", 7.66, crt_3_1),
];

export const OtherworldlyStoryStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("recharge_base", 8.5, crt_3_1),
];

export const EmeraldOrbStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("mastery_base", 20.4, crt_3_1),
];

export const TwinNephriteStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("crit_rate_base", 3.4, crt_3_1),
];

export const FavoniusCodexStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const WidsithStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_dmg_base", 12, crt_3_1),
];

export const SacrificialFragmentsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("mastery_base", 48, crt_3_1),
];

export const RoyalGrimoireStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const SolarPearlStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const PrototypeAmberStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const MappaMareStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("mastery_base", 24, crt_3_1),
];

export const BlackcliffAgateStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_dmg_base", 12, crt_3_1),
];

export const EyeofPerceptionStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const WineandSongStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const FrostbearerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const DodocoTalesStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const HakushinRingStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const OathswornEyeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const WanderingEvenstarStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const FruitOfFulfillmentStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const SacrificialJadeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("crit_rate_base", 8, crt_3_1),
];

export const FlowingPurityStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const BalladoftheBoundlessBlueStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const AshGravenDrinkingHornStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const WaveridingWhirlStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("recharge_base", 13.3333, crt_3_1),
];

export const RingOfCeibaStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const SkywardAtlasStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("atk_percent", 7.2, crt_3_1),
];

export const LostPrayerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_rate_base", 7.2, crt_3_1),
];

export const MemoryofDustStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const JadefallsSplendorStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("hp_percent", 10.8, crt_3_1),
];

export const EverlastingMoonglowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("hp_percent", 10.8, crt_3_1),
];

export const KagurasVerityStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const ThousandFloatingDreamsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("mastery_base", 57.6, crt_3_1),
];

export const TulaytullahsRemembranceStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_dmg_base", 9.6, crt_3_1),
];

export const CashflowSupervisionStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const TomeoftheEternalFlowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const CranesEchoingCallStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 49.1377, atk_3_3, asc_2),
  entry("atk_percent", 3.6, crt_3_1),
];

export const SurfingTimeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const StarcallersWatchStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("mastery_base", 57.6, crt_3_1),
];

export const MorningHibernationStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("mastery_base", 57.6, crt_3_1),
];

export const VividNotionsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_dmg_base", 9.6, crt_3_1),
];

export const RavenBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("mastery_base", 20.4, crt_3_1),
];

export const SharpshootersOathStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 38.7413, atk_1_1, asc_0),
  entry("crit_dmg_base", 10.2, crt_3_1),
];

export const RecurveBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("hp_percent", 10.2133, crt_3_1),
];

export const SlingshotStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 37.6075, atk_1_4, asc_0),
  entry("crit_rate_base", 6.8, crt_3_1),
];

export const MessengerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 39.8751, atk_1_2, asc_0),
  entry("crit_dmg_base", 6.8, crt_3_1),
];

export const FavoniusWarbowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("recharge_base", 13.3333, crt_3_1),
];

export const StringlessStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const SacrificialBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const RoyalBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const RustStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const PrototypeCrescentStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const CompoundBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("dmg_phys_base", 15.0133, crt_3_1),
];

export const BlackcliffWarbowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("crit_dmg_base", 8, crt_3_1),
];

export const ViridescentHuntStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("crit_rate_base", 6, crt_3_1),
];

export const AlleyHunterStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FadingTwilightStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("recharge_base", 6.6667, crt_3_1),
];

export const MitternachtsWaltzStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("dmg_phys_base", 11.26, crt_3_1),
];

export const WindblumeOdeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const HamayumiStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const PredatorStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const MouunsMoonStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const KingsSquireStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 41.0671, atk_2_4, asc_1),
  entry("atk_percent", 12, crt_3_1),
];

export const EndOfTheLineStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("recharge_base", 10, crt_3_1),
];

export const IbisPiercerStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const ScionOfTheBlazingSunStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("crit_rate_base", 4, crt_3_1),
];

export const SongOfStillnessStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const CloudforgedStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("mastery_base", 36, crt_3_1),
];

export const RangeGaugeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  entry("atk_percent", 6, crt_3_1),
];

export const FlowerWreathedFeathersStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("atk_percent", 9, crt_3_1),
];

export const ShatteredChainsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 43.7349, atk_2_2, asc_1),
  // MANUAL OVERRIDE: s4atkp6 is a StatTableAscensionWeapon (level-breakpoint substat).
  // Her db/generated/WeaponStatTables.js — the source this file is generated from —
  // approximates it as base×scale (6×crt_3_1 = 27.564 at L90), which DIVERGES from her
  // actual weapon object's AtkTables (s4atkp6 → 27.6 at L90, the value the oracle builds
  // from). Use the exact breakpoints to match the oracle. shattered_chains is the only
  // s4atkp6 weapon; the armory burndown guards this (a regen that reverts it → RED).
  new StatTableAscensionWeapon("atk_percent", [6, 10.6, 15.5, 17.9, 20.3, 22.7, 25.1, 27.6]),
];

export const SequenceofSolitudeStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, asc_1),
  entry("hp_percent", 9, crt_3_1),
];

export const SkywardHarpStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 47.537, atk_3_2, asc_2),
  entry("crit_rate_base", 4.8, crt_3_1),
];

export const AmosBowStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("atk_percent", 10.8, crt_3_1),
];

export const ElegyfortheEndStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("recharge_base", 12, crt_3_1),
];

export const PolarStarStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_rate_base", 7.2, crt_3_1),
];

export const AquaSimulacraStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_dmg_base", 19.2, crt_3_1),
];

export const ThunderingPulseStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const HuntersPathStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("crit_rate_base", 9.6, crt_3_1),
];

export const TheFirstGreatMagicStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

export const SilvershowerHeartstringsStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 44.3358, atk_3_4, asc_2),
  entry("hp_percent", 14.4, crt_3_1),
];

export const AstralVulturesCrimsonPlumageStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 45.9364, atk_3_1, asc_2),
  entry("crit_dmg_base", 14.4, crt_3_1),
];

// Default weapons per weapon type (oracle fixed build)
export const blackcliffPoleStatTable = BlackcliffPoleStatTable;
export const bellStatTable = BellStatTable;
export const alleyFlashStatTable = AlleyFlashStatTable;
export const alleyHunterStatTable = AlleyHunterStatTable;
export const solarPearlStatTable = SolarPearlStatTable;

// Backward-compat aliases (P1.7b consumers)
export const theBellStatTable = BellStatTable;

export const weaponStatTables = {
  CoolSteel: CoolSteelStatTable,
  HarbingerofDawn: HarbingerofDawnStatTable,
  TravelersHandySword: TravelersHandySwordStatTable,
  DarkIronSword: DarkIronSwordStatTable,
  FilletBlade: FilletBladeStatTable,
  SkyriderSword: SkyriderSwordStatTable,
  FavoniusSword: FavoniusSwordStatTable,
  Flute: FluteStatTable,
  SacrificialSword: SacrificialSwordStatTable,
  RoyalLongsword: RoyalLongswordStatTable,
  LionsRoar: LionsRoarStatTable,
  PrototypeRancour: PrototypeRancourStatTable,
  IronSting: IronStingStatTable,
  BlackcliffLongsword: BlackcliffLongswordStatTable,
  BlackSword: BlackSwordStatTable,
  AlleyFlash: AlleyFlashStatTable,
  SwordofDescension: SwordofDescensionStatTable,
  FesteringDesire: FesteringDesireStatTable,
  AmenomaKageuchi: AmenomaKageuchiStatTable,
  CinnabarSpindle: CinnabarSpindleStatTable,
  KagotsurubeIsshin: KagotsurubeIsshinStatTable,
  SapwoodBlade: SapwoodBladeStatTable,
  XiphosMoonlight: XiphosMoonlightStatTable,
  ToukabouShigure: ToukabouShigureStatTable,
  WolfFang: WolfFangStatTable,
  FinaleOfTheDeep: FinaleOfTheDeepStatTable,
  FleuveCendreFerryman: FleuveCendreFerrymanStatTable,
  TheDockhandsAssistant: TheDockhandsAssistantStatTable,
  SwordOfNarzissenkreuz: SwordOfNarzissenkreuzStatTable,
  SturdyBone: SturdyBoneStatTable,
  FlamebreathFlute: FlamebreathFluteStatTable,
  CalamityOfEshu: CalamityOfEshuStatTable,
  AquilaFavonia: AquilaFavoniaStatTable,
  SkywardBlade: SkywardBladeStatTable,
  FreedomSworn: FreedomSwornStatTable,
  SummitShaper: SummitShaperStatTable,
  PrimordialJadeCutter: PrimordialJadeCutterStatTable,
  MistsplitterReforged: MistsplitterReforgedStatTable,
  HaranGeppakuFutsu: HaranGeppakuFutsuStatTable,
  KeyofKhajNisut: KeyofKhajNisutStatTable,
  LightofFoliarIncision: LightofFoliarIncisionStatTable,
  SplendorOfStillWaters: SplendorOfStillWatersStatTable,
  UrakuMisugiri: UrakuMisugiriStatTable,
  Absolution: AbsolutionStatTable,
  PeakPatrolSong: PeakPatrolSongStatTable,
  Azurelight: AzurelightStatTable,
  FerrousShadow: FerrousShadowStatTable,
  BloodtaintedGreatsword: BloodtaintedGreatswordStatTable,
  WhiteIronGreatsword: WhiteIronGreatswordStatTable,
  DebateClub: DebateClubStatTable,
  SkyriderGreatsword: SkyriderGreatswordStatTable,
  FavoniusGreatsword: FavoniusGreatswordStatTable,
  Bell: BellStatTable,
  SacrificialGreatsword: SacrificialGreatswordStatTable,
  RoyalGreatsword: RoyalGreatswordStatTable,
  Rainslasher: RainslasherStatTable,
  PrototypeArchaic: PrototypeArchaicStatTable,
  Whiteblind: WhiteblindStatTable,
  BlackcliffSlasher: BlackcliffSlasherStatTable,
  SerpentSpine: SerpentSpineStatTable,
  LithicBlade: LithicBladeStatTable,
  SnowTombedStarsilver: SnowTombedStarsilverStatTable,
  LuxuriousSeaLord: LuxuriousSeaLordStatTable,
  KatsuragikiriNagamasa: KatsuragikiriNagamasaStatTable,
  MakhairaAquamarine: MakhairaAquamarineStatTable,
  Akuoumaru: AkuoumaruStatTable,
  ForestRegalia: ForestRegaliaStatTable,
  MailedFlower: MailedFlowerStatTable,
  TalkingStick: TalkingStickStatTable,
  TidalShadow: TidalShadowStatTable,
  MegaMagicSword: MegaMagicSwordStatTable,
  PortablePowerSaw: PortablePowerSawStatTable,
  FruitfulHook: FruitfulHookStatTable,
  Earthshaker: EarthshakerStatTable,
  FlameForgedInsight: FlameForgedInsightStatTable,
  SkywardPride: SkywardPrideStatTable,
  WolfsGravestone: WolfsGravestoneStatTable,
  SongofBrokenPines: SongofBrokenPinesStatTable,
  Unforged: UnforgedStatTable,
  RedhornStonethresher: RedhornStonethresherStatTable,
  BeaconOfTheReedSea: BeaconOfTheReedSeaStatTable,
  Verdict: VerdictStatTable,
  MountainKingsFang: MountainKingsFangStatTable,
  AThousandBlazingSuns: AThousandBlazingSunsStatTable,
  WhiteTassel: WhiteTasselStatTable,
  Halberd: HalberdStatTable,
  BlackTassel: BlackTasselStatTable,
  DragonsBane: DragonsBaneStatTable,
  PrototypeStarglitter: PrototypeStarglitterStatTable,
  CrescentPike: CrescentPikeStatTable,
  BlackcliffPole: BlackcliffPoleStatTable,
  Deathmatch: DeathmatchStatTable,
  LithicSpear: LithicSpearStatTable,
  FavoniusLance: FavoniusLanceStatTable,
  RoyalSpear: RoyalSpearStatTable,
  DragonspineSpear: DragonspineSpearStatTable,
  KitainCrossSpear: KitainCrossSpearStatTable,
  Catch: CatchStatTable,
  WavebreakersFin: WavebreakersFinStatTable,
  Moonpiercer: MoonpiercerStatTable,
  MissiveWindspear: MissiveWindspearStatTable,
  BalladOfTheFjords: BalladOfTheFjordsStatTable,
  RightfulReward: RightfulRewardStatTable,
  DialoguesOfTheDesertSages: DialoguesOfTheDesertSagesStatTable,
  ProspectorsDrill: ProspectorsDrillStatTable,
  MountainBracingBolt: MountainBracingBoltStatTable,
  RainbowsTrail: RainbowsTrailStatTable,
  BriefPavilionChatter: BriefPavilionChatterStatTable,
  StaffofHoma: StaffofHomaStatTable,
  SkywardSpine: SkywardSpineStatTable,
  VortexVanquisher: VortexVanquisherStatTable,
  PrimordialJadeWingedSpear: PrimordialJadeWingedSpearStatTable,
  CalamityQueller: CalamityQuellerStatTable,
  GrasscuttersLight: GrasscuttersLightStatTable,
  StaffOfScarletSands: StaffOfScarletSandsStatTable,
  CrimsonMoonsSemblance: CrimsonMoonsSemblanceStatTable,
  LumidouceElegy: LumidouceElegyStatTable,
  SymphonistofScents: SymphonistofScentsStatTable,
  FracturedHalo: FracturedHaloStatTable,
  MagicGuide: MagicGuideStatTable,
  ThrillingTalesofDragonSlayers: ThrillingTalesofDragonSlayersStatTable,
  OtherworldlyStory: OtherworldlyStoryStatTable,
  EmeraldOrb: EmeraldOrbStatTable,
  TwinNephrite: TwinNephriteStatTable,
  FavoniusCodex: FavoniusCodexStatTable,
  Widsith: WidsithStatTable,
  SacrificialFragments: SacrificialFragmentsStatTable,
  RoyalGrimoire: RoyalGrimoireStatTable,
  SolarPearl: SolarPearlStatTable,
  PrototypeAmber: PrototypeAmberStatTable,
  MappaMare: MappaMareStatTable,
  BlackcliffAgate: BlackcliffAgateStatTable,
  EyeofPerception: EyeofPerceptionStatTable,
  WineandSong: WineandSongStatTable,
  Frostbearer: FrostbearerStatTable,
  DodocoTales: DodocoTalesStatTable,
  HakushinRing: HakushinRingStatTable,
  OathswornEye: OathswornEyeStatTable,
  WanderingEvenstar: WanderingEvenstarStatTable,
  FruitOfFulfillment: FruitOfFulfillmentStatTable,
  SacrificialJade: SacrificialJadeStatTable,
  FlowingPurity: FlowingPurityStatTable,
  BalladoftheBoundlessBlue: BalladoftheBoundlessBlueStatTable,
  AshGravenDrinkingHorn: AshGravenDrinkingHornStatTable,
  WaveridingWhirl: WaveridingWhirlStatTable,
  RingOfCeiba: RingOfCeibaStatTable,
  SkywardAtlas: SkywardAtlasStatTable,
  LostPrayer: LostPrayerStatTable,
  MemoryofDust: MemoryofDustStatTable,
  JadefallsSplendor: JadefallsSplendorStatTable,
  EverlastingMoonglow: EverlastingMoonglowStatTable,
  KagurasVerity: KagurasVerityStatTable,
  ThousandFloatingDreams: ThousandFloatingDreamsStatTable,
  TulaytullahsRemembrance: TulaytullahsRemembranceStatTable,
  CashflowSupervision: CashflowSupervisionStatTable,
  TomeoftheEternalFlow: TomeoftheEternalFlowStatTable,
  CranesEchoingCall: CranesEchoingCallStatTable,
  SurfingTime: SurfingTimeStatTable,
  StarcallersWatch: StarcallersWatchStatTable,
  MorningHibernation: MorningHibernationStatTable,
  VividNotions: VividNotionsStatTable,
  RavenBow: RavenBowStatTable,
  SharpshootersOath: SharpshootersOathStatTable,
  RecurveBow: RecurveBowStatTable,
  Slingshot: SlingshotStatTable,
  Messenger: MessengerStatTable,
  FavoniusWarbow: FavoniusWarbowStatTable,
  Stringless: StringlessStatTable,
  SacrificialBow: SacrificialBowStatTable,
  RoyalBow: RoyalBowStatTable,
  Rust: RustStatTable,
  PrototypeCrescent: PrototypeCrescentStatTable,
  CompoundBow: CompoundBowStatTable,
  BlackcliffWarbow: BlackcliffWarbowStatTable,
  ViridescentHunt: ViridescentHuntStatTable,
  AlleyHunter: AlleyHunterStatTable,
  FadingTwilight: FadingTwilightStatTable,
  MitternachtsWaltz: MitternachtsWaltzStatTable,
  WindblumeOde: WindblumeOdeStatTable,
  Hamayumi: HamayumiStatTable,
  Predator: PredatorStatTable,
  MouunsMoon: MouunsMoonStatTable,
  KingsSquire: KingsSquireStatTable,
  EndOfTheLine: EndOfTheLineStatTable,
  IbisPiercer: IbisPiercerStatTable,
  ScionOfTheBlazingSun: ScionOfTheBlazingSunStatTable,
  SongOfStillness: SongOfStillnessStatTable,
  Cloudforged: CloudforgedStatTable,
  RangeGauge: RangeGaugeStatTable,
  FlowerWreathedFeathers: FlowerWreathedFeathersStatTable,
  ShatteredChains: ShatteredChainsStatTable,
  SequenceofSolitude: SequenceofSolitudeStatTable,
  SkywardHarp: SkywardHarpStatTable,
  AmosBow: AmosBowStatTable,
  ElegyfortheEnd: ElegyfortheEndStatTable,
  PolarStar: PolarStarStatTable,
  AquaSimulacra: AquaSimulacraStatTable,
  ThunderingPulse: ThunderingPulseStatTable,
  HuntersPath: HuntersPathStatTable,
  TheFirstGreatMagic: TheFirstGreatMagicStatTable,
  SilvershowerHeartstrings: SilvershowerHeartstringsStatTable,
  AstralVulturesCrimsonPlumage: AstralVulturesCrimsonPlumageStatTable,
};
