/** 波色：01-80 分为红蓝绿三区 */
export const BOSE_MAP = buildMap({
  red: [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46, 51, 56, 57, 58, 63, 64, 69, 70, 75, 76],
  blue: [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48, 52, 53, 59, 60, 65, 66, 71, 72, 77, 78],
  green: [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49, 50, 54, 55, 61, 62, 67, 68, 73, 74, 79, 80],
})

/** 八卦：每卦 10 个号码 */
export const BAGUA_GROUPS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
  [71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
]

/** 五行（洛书）：按和值区间 */
export function getWuxingBySum(sum) {
  if (sum <= 695) return 0 // 金
  if (sum <= 763) return 1 // 木
  if (sum <= 855) return 2 // 水
  if (sum <= 923) return 3 // 火
  return 4 // 土
}

/** 五行（易经）：按号码个位分组简化 */
export function getWuxingByTail(tailValue) {
  if ([4, 9].includes(tailValue)) return 0 // 金
  if ([3, 8].includes(tailValue)) return 1 // 木
  if ([1, 6].includes(tailValue)) return 2 // 水
  if ([2, 7].includes(tailValue)) return 3 // 火
  return 4 // 土
}

export function getBoseColor(num) {
  return BOSE_MAP[num] || 'green'
}

function buildMap(groups) {
  const map = {}
  for (const [color, nums] of Object.entries(groups)) {
    for (const num of nums) map[num] = color
  }
  return map
}
