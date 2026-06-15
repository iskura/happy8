import { DEFAULT_TREND_UI } from './trendTableDefaults.js'

/**
 * 图表注册表 — 单一配置源
 *
 * 字段说明：
 * - kind: 'trend' | 'summary' — 决定渲染组件（走势表 / 汇总表）
 * - builderKey: builders.js 中对应的构建函数键（默认同 id）
 * - title / desc / indicatorHelp: 展示元数据
 * - ui: 走势表 UI 特性（图例、预测、统计行等），与 trendTableDefaults 合并
 */
export const CHART_REGISTRY = {
  hmfb: {
    id: 'hmfb',
    label: '号码分布',
    kind: 'trend',
    title: '走势图',
    desc: '横向 01–80 为号码列，红球为当期开出，灰字为连续遗漏期数',
    indicatorHelp: '号码分布：横向 01–80 为号码列，红球为当期开出，灰字为连续遗漏期数。',
    ui: {
      prediction: { enabled: true, maxColumns: null },
    },
  },

  hzw: {
    id: 'hzw',
    label: '和值尾',
    kind: 'trend',
    title: '快乐8和值尾走势图',
    desc: '和值尾 0-9 及大小、奇偶、质合、012路、升平降、振幅、五行',
    indicatorHelp: [
      '和值尾：20个开奖号之和的个位（0-9）。',
      '和值尾大小：小数（0-4）大数（5-9）。',
      '和值尾奇偶：偶数（0，2，4，6，8）奇数（1，3，5，7，9）。',
      '和值尾质合：合数（0，4，6，8，9）质数（1，2，3，5，7）。',
      '和值尾012路：0路（0，3，6，9）1路（1，4，7）2路（2，5，8）。',
      '和值尾升平降：本期和值尾大于上期和值尾称为升，与上期相同称为平，小于上期称为降。',
      '和值尾振幅：本期和值尾与上期和值尾差值的绝对值。',
      '和值五行：金（210-695）木（696-763）水（764-855）火（856-923）土（924-1410）。',
    ],
    ui: {
      prediction: { enabled: true, maxColumns: 10 },
    },
  },

  kdw: {
    id: 'kdw',
    label: '跨度尾',
    kind: 'trend',
    title: '快乐8跨度尾走势图',
    desc: '最大号减最小号之差的个位走势',
    indicatorHelp: '跨度尾：最大号减最小号之差的个位（0-9）。',
  },

  jzw: {
    id: 'jzw',
    label: '均值尾',
    kind: 'trend',
    title: '快乐8均值尾走势图',
    desc: '和值除以 20 取整后的个位走势',
    indicatorHelp: '均值尾：和值除以 20 取整后的个位（0-9）。',
  },

  hkhw: {
    id: 'hkhw',
    label: '和跨和尾',
    kind: 'trend',
    title: '快乐8和跨和尾走势图',
    desc: '和值加跨度的个位走势',
    indicatorHelp: '和跨和尾：和值加跨度之和的个位（0-9）。',
  },

  hkcw: {
    id: 'hkcw',
    label: '和跨差尾',
    kind: 'trend',
    title: '快乐8和跨差尾走势图',
    desc: '和值减跨度之差的个位走势',
    indicatorHelp: '和跨差尾：和值减跨度之差的个位（0-9）。',
  },

  zdhw: {
    id: 'zdhw',
    label: '最大号尾数',
    kind: 'trend',
    title: '快乐8最大号尾数走势图',
    desc: '当期最大开奖号的个位走势',
    indicatorHelp: '最大号尾数：当期最大开奖号的个位（0-9）。',
  },

  zxhw: {
    id: 'zxhw',
    label: '最小号尾数',
    kind: 'trend',
    title: '快乐8最小号尾数走势图',
    desc: '当期最小开奖号的个位走势',
    indicatorHelp: '最小号尾数：当期最小开奖号的个位（0-9）。',
  },

  hlfb: {
    id: 'hlfb',
    label: '行列分布',
    kind: 'trend',
    title: '快乐8行列分布走势图',
    desc: '8 行 × 10 列号码分布，每 10 个号码一分区',
    indicatorHelp: '行列分布：8 行 × 10 列号码分布，每 10 个号码一分区。',
  },

  jo: {
    id: 'jo',
    label: '奇偶分布',
    kind: 'trend',
    title: '快乐8奇偶分布走势图',
    desc: '每期奇数号码个数（0-20）走势',
    indicatorHelp: '奇偶分布：每期开奖号码中奇数的个数（0-20）。',
  },

  jofb: {
    id: 'jofb',
    label: '奇偶分布2',
    kind: 'trend',
    title: '快乐8奇偶分布2走势图',
    desc: '每期偶数号码个数（0-20）走势',
    indicatorHelp: '奇偶分布2：每期开奖号码中偶数的个数（0-20）。',
  },

  zt: {
    id: 'zt',
    label: '字头',
    kind: 'trend',
    title: '快乐8字头走势图',
    desc: '按号码字头（0-8 字）统计命中',
    indicatorHelp: '字头：按号码字头（0-8 字）统计命中。',
  },

  zt2: {
    id: 'zt2',
    label: '字头2',
    kind: 'trend',
    title: '快乐8字头2走势图',
    desc: '按号码字头分组统计命中',
    indicatorHelp: '字头2：按号码字头分组统计命中。',
  },

  wsfb: {
    id: 'wsfb',
    label: '0-9尾分布图',
    kind: 'trend',
    title: '快乐8尾分布走势图',
    desc: '按号码尾数 0-9 分组统计命中',
    indicatorHelp: '尾分布：按号码尾数 0-9 分组统计命中。',
  },

  bose: {
    id: 'bose',
    label: '波色',
    kind: 'trend',
    title: '快乐8波色走势图',
    desc: '红蓝绿波色号码分布',
    indicatorHelp: '波色：红蓝绿波色号码分布。',
    ui: {
      legendExtra: [
        { key: 'bose-red', dotClass: 'bose-red', label: '红波' },
        { key: 'bose-blue', dotClass: 'bose-blue', label: '蓝波' },
        { key: 'bose-green', dotClass: 'bose-green', label: '绿波' },
      ],
    },
  },

  spj: {
    id: 'spj',
    label: '升平降',
    kind: 'trend',
    title: '快乐8升平降走势图',
    desc: '和值尾相比上期的升、平、降',
    indicatorHelp: '升平降：本期和值尾大于上期为升，相同为平，小于为降。',
  },

  wsdx: {
    id: 'wsdx',
    label: '尾数大小',
    kind: 'trend',
    title: '快乐8尾数大小走势图',
    desc: '和值尾大小（0-4 小，5-9 大）',
    indicatorHelp: '尾数大小：和值尾小数（0-4）大数（5-9）。',
  },

  bg: {
    id: 'bg',
    label: '八卦',
    kind: 'trend',
    title: '快乐8八卦走势图',
    desc: '按八卦分区统计号码命中',
    indicatorHelp: '八卦：按八卦分区统计号码命中。',
  },

  rlt: {
    id: 'rlt',
    label: '热力图',
    kind: 'trend',
    title: '快乐8热力图',
    desc: '号码分布热力展示',
    indicatorHelp: '热力图：号码分布热力展示。',
    ui: {
      heatmap: true,
    },
  },

  wxls: {
    id: 'wxls',
    label: '五行(洛书)',
    kind: 'trend',
    title: '快乐8五行(洛书)走势图',
    desc: '按和值区间对应五行',
    indicatorHelp: '五行（洛书）：金（210-695）木（696-763）水（764-855）火（856-923）土（924-1410）。',
  },

  wxyj: {
    id: 'wxyj',
    label: '五行(易经)',
    kind: 'trend',
    title: '快乐8五行(易经)走势图',
    desc: '按和值尾对应五行',
    indicatorHelp: '五行（易经）：按和值尾对应金木水火土。',
  },

  dwfb: {
    id: 'dwfb',
    label: '对望分布图',
    kind: 'trend',
    title: '快乐8对望分布图',
    desc: '开奖号及其对望号（81-n）同时标注',
    indicatorHelp: '对望分布：开奖号及其对望号（81-n）同时标注。',
  },

  ylqs: {
    id: 'ylqs',
    label: '遗漏期数及出号个数',
    kind: 'summary',
    title: '快乐8遗漏期数及出号个数',
    desc: '各号码在统计期内的出现次数与遗漏',
    indicatorHelp: '遗漏期数及出号个数：各号码在统计期内的出现次数与遗漏。',
    ui: {
      prediction: { enabled: false },
    },
  },
}

/** 导航栏用：从注册表生成 */
export const CHART_TYPES = Object.values(CHART_REGISTRY).map(({ id, label }) => ({
  id,
  label,
}))

export function getChartRegistryEntry(chartId) {
  return CHART_REGISTRY[chartId] || CHART_REGISTRY.hmfb
}

/**
 * 合并注册表 UI 配置与运行时图表数据，供 TrendTable 消费
 */
export function resolveChartUi(registryEntry, chartData = {}) {
  const baseUi = {
    ...DEFAULT_TREND_UI,
    ...registryEntry.ui,
    prediction: {
      ...DEFAULT_TREND_UI.prediction,
      ...registryEntry.ui?.prediction,
    },
  }

  const legend = [
    ...baseUi.legend,
    ...(registryEntry.ui?.legendExtra || []),
  ]

  const predictionMaxColumns =
    chartData.predictionColumns ?? baseUi.prediction.maxColumns

  return {
    kind: registryEntry.kind || 'trend',
    prediction: {
      enabled: baseUi.prediction.enabled !== false,
      maxColumns: predictionMaxColumns,
    },
    freeze: baseUi.freeze,
    statRows: baseUi.statRows,
    legend,
    heatmap: chartData.isHeatmap ?? baseUi.heatmap ?? false,
    narrowColumnsThreshold: baseUi.narrowColumnsThreshold,
    narrowColWidth: baseUi.narrowColWidth,
    defaultColWidth: baseUi.defaultColWidth,
  }
}
