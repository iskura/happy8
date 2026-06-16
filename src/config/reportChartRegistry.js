/**
 * 数据报表页图表注册表 — 卡片 id → 组件类型、数据字段、图表配置
 *
 * kind: 'trend' | 'h-bars' | 'stacked-ratio' | 'zone-compare'（后续可扩展）
 * dataKey: report 快照上的字段名
 * trend: ReportTrendChart 配置（mode / color / valueLabel / valueSuffix）
 */
export const REPORT_CHART_REGISTRY = {
  repeat: {
    kind: 'trend',
    dataKey: 'repeatTrend',
    trend: {
      mode: 'bar',
      color: 'var(--primary)',
      valueLabel: '重号',
      valueSuffix: ' 个',
    },
  },
  consecutive: {
    kind: 'trend',
    dataKey: 'consecutiveTrend',
    trend: {
      mode: 'bar',
      color: 'var(--warning-strong)',
      valueLabel: '连号组',
      valueSuffix: ' 组',
    },
  },
  sum: {
    kind: 'trend',
    dataKey: 'sumTrend',
    trend: {
      mode: 'line',
      color: 'var(--link)',
      valueLabel: '和值',
      valueSuffix: '',
    },
  },
}

export function getReportChartEntry(cardId) {
  return REPORT_CHART_REGISTRY[cardId] || null
}
