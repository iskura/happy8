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
  BOSE_MAP,
  BAGUA_GROUPS,
  getWuxingBySum,
  getWuxingByTail,
  getBoseColor,
} from './groups.js'
import { buildTrendChart, buildOmissionSummary } from './trendBase.js'

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

  hzw: (records, options) => tailChart(records, (nums) => calcSum(nums), options),
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
      headers: ['小(0-4)', '大(5-9)'],
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

export const CHART_META = {
  hmfb: { title: '快乐8号码分布走势图', desc: '横向 01–80 为号码列，红球为当期开出，灰字为连续遗漏期数' },
  hzw: { title: '快乐8和值尾走势图', desc: '20 个开奖号之和的个位（0-9）走势' },
  kdw: { title: '快乐8跨度尾走势图', desc: '最大号减最小号之差的个位走势' },
  jzw: { title: '快乐8均值尾走势图', desc: '和值除以 20 取整后的个位走势' },
  hkhw: { title: '快乐8和跨和尾走势图', desc: '和值加跨度的个位走势' },
  hkcw: { title: '快乐8和跨差尾走势图', desc: '和值减跨度之差的个位走势' },
  zdhw: { title: '快乐8最大号尾数走势图', desc: '当期最大开奖号的个位走势' },
  zxhw: { title: '快乐8最小号尾数走势图', desc: '当期最小开奖号的个位走势' },
  hlfb: { title: '快乐8行列分布走势图', desc: '8 行 × 10 列号码分布，每 10 个号码一分区' },
  jo: { title: '快乐8奇偶分布走势图', desc: '每期奇数号码个数（0-20）走势' },
  jofb: { title: '快乐8奇偶分布2走势图', desc: '每期偶数号码个数（0-20）走势' },
  zt: { title: '快乐8字头走势图', desc: '按号码字头（0-8 字）统计命中' },
  zt2: { title: '快乐8字头2走势图', desc: '按号码字头分组统计命中' },
  wsfb: { title: '快乐8尾分布走势图', desc: '按号码尾数 0-9 分组统计命中' },
  bose: { title: '快乐8波色走势图', desc: '红蓝绿波色号码分布' },
  spj: { title: '快乐8升平降走势图', desc: '和值尾相比上期的升、平、降' },
  wsdx: { title: '快乐8尾数大小走势图', desc: '和值尾大小（0-4 小，5-9 大）' },
  bg: { title: '快乐8八卦走势图', desc: '按八卦分区统计号码命中' },
  rlt: { title: '快乐8热力图', desc: '号码分布热力展示' },
  wxls: { title: '快乐8五行(洛书)走势图', desc: '按和值区间对应五行' },
  wxyj: { title: '快乐8五行(易经)走势图', desc: '按和值尾对应五行' },
  dwfb: { title: '快乐8对望分布图', desc: '开奖号及其对望号（81-n）同时标注' },
  ylqs: { title: '快乐8遗漏期数及出号个数', desc: '各号码在统计期内的出现次数与遗漏' },
}

export function buildChart(chartId, records, options = {}) {
  const builder = BUILDERS[chartId] || BUILDERS.hmfb
  const data = builder(records, options)
  const meta = CHART_META[chartId] || CHART_META.hmfb
  return { ...data, id: chartId, ...meta }
}
