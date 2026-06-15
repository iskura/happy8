/** 走势表 UI 默认配置，可被 chartRegistry 单项覆盖 */

export const ISSUE_COL_WIDTH = 120

export const DEFAULT_STAT_ROWS = [
  {
    key: 'appearCount',
    label: '出现次数',
    help: '统计期数内实际出现的次数。',
  },
  {
    key: 'avgOmission',
    label: '平均遗漏',
    help: '统计期数内遗漏的平均值（除不尽四舍五入取整）。计算公式：平均遗漏 = 每次遗漏期数之和 / 出现次数。',
  },
  {
    key: 'maxOmission',
    label: '最大遗漏',
    help: '统计期数内遗漏的最大值。',
  },
  {
    key: 'maxConsecutive',
    label: '最大连出',
    help: '统计期数内连续开出的最大值。',
  },
  {
    key: 'desireRatio',
    label: '欲出几率',
    help: '当前遗漏 / 平均遗漏（除不尽四舍五入取整）。',
  },
]

export const BASE_LEGEND_ITEMS = [
  { key: 'hit', dotClass: 'hit', label: '开出号码' },
  { key: 'miss', dotClass: 'miss', label: '遗漏期数' },
  { key: 'repeat', dotClass: 'mark-repeat', label: '重号' },
  { key: 'edge', dotClass: 'mark-edge', label: '边号' },
]

export const DEFAULT_FREEZE_PANELS = {
  head: true,
  pred: true,
  stats: true,
}

export const DEFAULT_TREND_UI = {
  kind: 'trend',
  prediction: {
    enabled: true,
    maxColumns: null,
  },
  freeze: DEFAULT_FREEZE_PANELS,
  statRows: DEFAULT_STAT_ROWS,
  legend: BASE_LEGEND_ITEMS,
  narrowColumnsThreshold: 10,
  narrowColWidth: 36,
  defaultColWidth: 22,
}
