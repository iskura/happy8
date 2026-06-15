export { CHART_TYPES } from '../config/chartRegistry.js'

export const PERIOD_PRESETS = [30, 60, 100, 200, 400, 500, 1000]

export const WEEKDAY_OPTIONS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
]

export const MARK_OPTIONS = [
  { key: 'repeat', label: '重号' },
  { key: 'consecutive', label: '连号' },
  { key: 'edge', label: '边号' },
  { key: 'omission', label: '遗漏' },
  { key: 'omissionLayer', label: '遗漏分层' },
  { key: 'zoneLine', label: '分区线' },
  { key: 'segmentLine', label: '分段线' },
]
