import { formatBall } from '../format.js'
import { attachMarksToRows } from '../chartMarks.js'
import { sortRecordsByIssue } from '../sortRecords.js'

export function getOmissionLevel(omission) {
  if (omission >= 15) return 'high'
  if (omission >= 8) return 'mid'
  if (omission >= 4) return 'low'
  return 'normal'
}

export function getOmissionLayer(omission) {
  if (omission <= 0) return 0
  if (omission <= 5) return 1
  if (omission <= 10) return 2
  if (omission <= 15) return 3
  if (omission <= 20) return 4
  return 5
}

function getWeekday(dateStr) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays[new Date(`${dateStr}T00:00:00`).getDay()]
}

function createStats(columnCount) {
  const size = columnCount + 1
  return {
    appearCount: Array.from({ length: size }, () => 0),
    currentOmission: Array.from({ length: size }, () => 0),
    maxOmission: Array.from({ length: size }, () => 0),
    avgOmission: Array.from({ length: size }, () => 0),
    maxConsecutive: Array.from({ length: size }, () => 0),
    desireRatio: Array.from({ length: size }, () => 0),
  }
}

/**
 * 通用走势表格构建器
 * @param {Array} records 开奖记录
 * @param {Object} config
 * @param {number} config.columnCount 列数
 * @param {string[]} config.headers 表头
 * @param {Function} config.getActiveCols (record) => number[] 当期命中的列（1-based）
 * @param {Function} [config.formatHit] (col) => string
 * @param {Function} [config.getCellClass] (col, record) => string
 * @param {number} [config.zoneEvery] 分区线间隔
 */
export function buildTrendChart(records, config) {
  const {
    columnCount,
    headers,
    getActiveCols,
    formatHit = (col) => String(col - 1),
    getCellClass,
    zoneEvery = 0,
    rowOrder = 'asc',
  } = config

  if (!records.length) {
    return {
      headers,
      columnCount,
      zoneEvery,
      rows: [],
      stats: createStats(columnCount),
      periodCount: 0,
    }
  }

  const newestFirst = sortRecordsByIssue(records, 'desc')
  const chronological = [...newestFirst].reverse()
  const omissionState = Array.from({ length: columnCount + 1 }, () => 0)
  const omissionSums = Array.from({ length: columnCount + 1 }, () => 0)
  const appearCounts = Array.from({ length: columnCount + 1 }, () => 0)
  const maxOmissionTrack = Array.from({ length: columnCount + 1 }, () => 0)
  const maxConsecutive = Array.from({ length: columnCount + 1 }, () => 0)
  const currentStreak = Array.from({ length: columnCount + 1 }, () => 0)
  const rows = []

  for (const record of chronological) {
    const activeCols = getActiveCols(record)
    const activeSet = new Set(activeCols)
    const cells = []

    for (let col = 1; col <= columnCount; col += 1) {
      if (activeSet.has(col)) {
        omissionSums[col] += omissionState[col]
        appearCounts[col] += 1
        maxOmissionTrack[col] = Math.max(maxOmissionTrack[col], omissionState[col])
        omissionState[col] = 0
        currentStreak[col] += 1
        maxConsecutive[col] = Math.max(maxConsecutive[col], currentStreak[col])
        cells.push({
          type: 'hit',
          num: col,
          label: formatHit(col),
          omission: 0,
          cellClass: getCellClass?.(col, record) || '',
        })
      } else {
        omissionState[col] += 1
        maxOmissionTrack[col] = Math.max(maxOmissionTrack[col], omissionState[col])
        currentStreak[col] = 0
        cells.push({
          type: 'miss',
          num: col,
          label: '',
          omission: omissionState[col],
          cellClass: getCellClass?.(col, record) || '',
        })
      }
    }

    rows.push({
      issue: record.issue,
      date: record.date,
      weekday: getWeekday(record.date),
      numbers: record.numbers,
      activeCols,
      numbersText: record.numbers.map((n) => formatBall(n)).join(' '),
      cells,
    })
  }

  const displayRows =
    rowOrder === 'desc'
      ? attachMarksToRows([...rows].reverse(), columnCount, 'desc')
      : attachMarksToRows(rows, columnCount, 'asc')
  const stats = createStats(columnCount)

  const latestRow = rows[rows.length - 1]
  if (latestRow) {
    for (const cell of latestRow.cells) {
      stats.currentOmission[cell.num] = cell.type === 'hit' ? 0 : cell.omission
    }
  }

  for (let col = 1; col <= columnCount; col += 1) {
    stats.appearCount[col] = appearCounts[col]
    stats.maxOmission[col] = maxOmissionTrack[col]
    stats.avgOmission[col] = appearCounts[col]
      ? Math.round(omissionSums[col] / appearCounts[col])
      : 0
    stats.maxConsecutive[col] = maxConsecutive[col] || 0
    const avg = stats.avgOmission[col]
    stats.desireRatio[col] = avg > 0 ? Math.round(stats.currentOmission[col] / avg) : 0
  }

  return {
    headers,
    columnCount,
    zoneEvery,
    rows: displayRows,
    stats,
    periodCount: records.length,
  }
}

/**
 * 遗漏期数及出号个数（按号码汇总）
 */
export function buildOmissionSummary(records) {
  const newestFirst = sortRecordsByIssue(records, 'desc')
  const chronological = [...newestFirst].reverse()
  const omissionState = Array.from({ length: 81 }, () => 0)
  const appearCount = Array.from({ length: 81 }, () => 0)
  const omissionSums = Array.from({ length: 81 }, () => 0)
  const maxOmission = Array.from({ length: 81 }, () => 0)

  for (const record of chronological) {
    for (let num = 1; num <= 80; num += 1) {
      if (record.numbers.includes(num)) {
        omissionSums[num] += omissionState[num]
        maxOmission[num] = Math.max(maxOmission[num], omissionState[num])
        omissionState[num] = 0
        appearCount[num] += 1
      } else {
        omissionState[num] += 1
        maxOmission[num] = Math.max(maxOmission[num], omissionState[num])
      }
    }
  }

  const items = []
  for (let num = 1; num <= 80; num += 1) {
    items.push({
      num,
      appearCount: appearCount[num],
      currentOmission: omissionState[num],
      avgOmission: appearCount[num]
        ? Math.round(omissionSums[num] / appearCount[num])
        : 0,
      maxOmission: maxOmission[num],
    })
  }

  return { items, periodCount: records.length }
}
