import { formatBall } from '../format.js'
import { sortRecordsByIssue } from '../sortRecords.js'
import {
  calcSum,
  calcSpan,
  calcMean,
  tail,
  countOdd,
  countEven,
  countByHead,
  countByTailDigit,
  getTrend,
  isTailBig,
} from './metrics.js'
import {
  BAGUA_GROUPS,
  getWuxingBySum,
  getWuxingByTail,
  getBoseColor,
} from './groups.js'
import { buildTrendChart, buildOmissionSummary } from './trendBase.js'
import { buildSumTailChart } from './hzwChart.js'
import { getChartRegistryEntry, resolveChartUi } from '../../config/chartRegistry.js'

const TAIL_HEADERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const tailCol = (value) => tail(value) + 1

function trendOptions(options = {}) {
  return options.rowOrder ? { rowOrder: options.rowOrder } : {}
}

function tailChart(records, getValue, options = {}) {
  return buildTrendChart(records, {
    ...trendOptions(options),
    columnCount: 10,
    headers: TAIL_HEADERS,
    getActiveCols: (record) => [tailCol(getValue(record.numbers))],
    formatHit: (col) => TAIL_HEADERS[col - 1],
    zoneEvery: 5,
  })
}

function countChart(records, getCount, maxCount, headers, options = {}) {
  return buildTrendChart(records, {
    ...trendOptions(options),
    columnCount: maxCount + 1,
    headers,
    getActiveCols: (record) => [getCount(record.numbers) + 1],
    formatHit: (col) => String(col - 1),
  })
}

const BUILDERS = {
  hmfb(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 80,
      headers: Array.from({ length: 80 }, (_, i) => formatBall(i + 1)),
      getActiveCols: (record) => record.numbers,
      formatHit: (col) => formatBall(col),
      zoneEvery: 10,
    })
  },

  hzw: (records, options) => buildSumTailChart(records, options),
  kdw: (records, options) => tailChart(records, (nums) => calcSpan(nums), options),
  jzw: (records, options) => tailChart(records, (nums) => calcMean(nums), options),
  hkhw: (records, options) => tailChart(records, (nums) => calcSum(nums) + calcSpan(nums), options),
  hkcw: (records, options) => tailChart(records, (nums) => Math.abs(calcSum(nums) - calcSpan(nums)), options),
  zdhw: (records, options) => tailChart(records, (nums) => Math.max(...nums), options),
  zxhw: (records, options) => tailChart(records, (nums) => Math.min(...nums), options),

  hlfb(records, options) {
    const chart = BUILDERS.hmfb(records, options)
    chart.zoneEvery = 10
    return chart
  },

  jo(records, options) {
    return countChart(
      records,
      countOdd,
      20,
      Array.from({ length: 21 }, (_, i) => String(i)),
      options,
    )
  },

  jofb(records, options) {
    return countChart(
      records,
      countEven,
      20,
      Array.from({ length: 21 }, (_, i) => String(i)),
      options,
    )
  },

  zt(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 9,
      headers: ['0', '1', '2', '3', '4', '5', '6', '7', '8'].map((h) => `${h}字`),
      getActiveCols: (record) => {
        const counts = countByHead(record.numbers)
        return counts.map((count, index) => (count > 0 ? index + 1 : null)).filter(Boolean)
      },
      formatHit: (col) => `${col - 1}`,
    })
  },

  zt2(records, options) {
    const chart = BUILDERS.zt(records, options)
    chart.headers = chart.headers.map((h) => `${h}头`)
    return chart
  },

  wsfb(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 10,
      headers: TAIL_HEADERS.map((h) => `${h}尾`),
      getActiveCols: (record) => {
        const counts = countByTailDigit(record.numbers)
        return counts.map((count, index) => (count > 0 ? index + 1 : null)).filter(Boolean)
      },
      formatHit: (col) => TAIL_HEADERS[col - 1],
      zoneEvery: 5,
    })
  },

  bose(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 80,
      headers: Array.from({ length: 80 }, (_, i) => formatBall(i + 1)),
      getActiveCols: (record) => record.numbers,
      formatHit: (col) => formatBall(col),
      getCellClass: (col) => `bose-${getBoseColor(col)}`,
      zoneEvery: 10,
    })
  },

  spj(records, options = {}) {
    const chronological = [...sortRecordsByIssue(records, 'desc')].reverse()
    const trendMap = new Map()
    let prevTail = null
    for (const record of chronological) {
      const sumTail = tail(calcSum(record.numbers))
      let trendCol = 1
      if (prevTail !== null) trendCol = getTrend(prevTail, sumTail) + 1
      trendMap.set(record.issue, trendCol)
      prevTail = sumTail
    }

    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 3,
      headers: ['升', '平', '降'],
      getActiveCols: (record) => [trendMap.get(record.issue) || 1],
      formatHit: (col) => ['升', '平', '降'][col - 1],
    })
  },

  wsdx(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 2,
      headers: ['小', '大'],
      getActiveCols: (record) => {
        const sumTail = tail(calcSum(record.numbers))
        return [isTailBig(sumTail) ? 2 : 1]
      },
      formatHit: (col) => (col === 1 ? '小' : '大'),
    })
  },

  bg(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 8,
      headers: ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'],
      getActiveCols: (record) => {
        const active = new Set()
        for (const num of record.numbers) {
          const groupIndex = BAGUA_GROUPS.findIndex((group) => group.includes(num))
          if (groupIndex >= 0) active.add(groupIndex + 1)
        }
        return [...active]
      },
      formatHit: (col) => ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'][col - 1],
    })
  },

  rlt(records, options) {
    const chart = BUILDERS.hmfb(records, options)
    chart.isHeatmap = true
    return chart
  },

  wxls(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 5,
      headers: ['金', '木', '水', '火', '土'],
      getActiveCols: (record) => [getWuxingBySum(calcSum(record.numbers)) + 1],
      formatHit: (col) => ['金', '木', '水', '火', '土'][col - 1],
    })
  },

  wxyj(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 5,
      headers: ['金', '木', '水', '火', '土'],
      getActiveCols: (record) => [getWuxingByTail(tail(calcSum(record.numbers))) + 1],
      formatHit: (col) => ['金', '木', '水', '火', '土'][col - 1],
    })
  },

  dwfb(records, options = {}) {
    return buildTrendChart(records, {
      ...trendOptions(options),
      columnCount: 80,
      headers: Array.from({ length: 80 }, (_, i) => formatBall(i + 1)),
      getActiveCols: (record) => {
        const active = new Set(record.numbers)
        for (const num of record.numbers) {
          const mirror = 81 - num
          if (mirror >= 1 && mirror <= 80) active.add(mirror)
        }
        return [...active]
      },
      formatHit: (col) => formatBall(col),
      zoneEvery: 10,
    })
  },

  ylqs(records) {
    return buildOmissionSummary(records)
  },
}

/** @deprecated 请使用 chartRegistry */
export const CHART_INDICATOR_HELP = Object.fromEntries(
  Object.entries(getChartRegistryEntries()).map(([id, entry]) => [id, entry.indicatorHelp]),
)

/** @deprecated 请使用 chartRegistry */
export const CHART_META = Object.fromEntries(
  Object.entries(getChartRegistryEntries()).map(([id, entry]) => [
    id,
    { title: entry.title, desc: entry.desc },
  ]),
)

function getChartRegistryEntries() {
  return Object.fromEntries(
    Object.keys(BUILDERS).map((id) => [id, getChartRegistryEntry(id)]),
  )
}

export function buildChart(chartId, records, options = {}) {
  const registryEntry = getChartRegistryEntry(chartId)
  const builderKey = registryEntry.builderKey || chartId
  const builder = BUILDERS[builderKey] || BUILDERS.hmfb
  const data = builder(records, options)

  const statsColumnOffset = data.statsColumnOffset ?? 0
  const statsColumnCount = data.statsColumnCount ?? data.columnCount - statsColumnOffset

  const historyRecords = options.historyRecords
  let historyStats = data.stats
  if (historyRecords?.length) {
    const historyData = builder(historyRecords, { ...options, rowOrder: 'asc' })
    historyStats = historyData.stats
  }

  return {
    ...data,
    id: chartId,
    kind: registryEntry.kind,
    title: registryEntry.title,
    desc: registryEntry.desc,
    indicatorHelp: registryEntry.indicatorHelp,
    ui: resolveChartUi(registryEntry, data),
    statsColumnOffset,
    statsColumnCount,
    historyStats,
  }
}
