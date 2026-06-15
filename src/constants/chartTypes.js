export const CHART_TYPES = [
  { id: 'hmfb', label: '号码分布' },
  { id: 'hzw', label: '和值尾' },
  { id: 'kdw', label: '跨度尾' },
  { id: 'jzw', label: '均值尾' },
  { id: 'hkhw', label: '和跨和尾' },
  { id: 'hkcw', label: '和跨差尾' },
  { id: 'zdhw', label: '最大号尾数' },
  { id: 'zxhw', label: '最小号尾数' },
  { id: 'hlfb', label: '行列分布' },
  { id: 'jo', label: '奇偶分布' },
  { id: 'jofb', label: '奇偶分布2' },
  { id: 'zt', label: '字头' },
  { id: 'zt2', label: '字头2' },
  { id: 'wsfb', label: '0-9尾分布图' },
  { id: 'bose', label: '波色' },
  { id: 'spj', label: '升平降' },
  { id: 'wsdx', label: '尾数大小' },
  { id: 'bg', label: '八卦' },
  { id: 'rlt', label: '热力图' },
  { id: 'wxls', label: '五行(洛书)' },
  { id: 'wxyj', label: '五行(易经)' },
  { id: 'dwfb', label: '对望分布图' },
  { id: 'ylqs', label: '遗漏期数及出号个数' },
]

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
