import { calcSum, countOdd } from './charts/metrics.js'
import { buildOmissionSummary } from './charts/trendBase.js'

const ZONES = [
  { label: '一区', range: '01-20', min: 1, max: 20 },
  { label: '二区', range: '21-40', min: 21, max: 40 },
  { label: '三区', range: '41-60', min: 41, max: 60 },
  { label: '四区', range: '61-80', min: 61, max: 80 },
]

function countZoneHits(numbers) {
  return ZONES.map((z) => ({
    ...z,
    count: numbers.filter((n) => n >= z.min && n <= z.max).length,
  }))
}

function listConsecutiveGroups(numbers) {
  if (!numbers?.length) return []
  const sorted = [...numbers].sort((a, b) => a - b)
  const groups = []
  let group = [sorted[0]]
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] - sorted[i - 1] === 1) {
      group.push(sorted[i])
    } else {
      if (group.length >= 2) groups.push(group)
      group = [sorted[i]]
    }
  }
  if (group.length >= 2) groups.push(group)
  return groups
}

function countConsecutiveGroups(numbers) {
  return listConsecutiveGroups(numbers).length
}

function countRepeat(current, previous) {
  if (!previous) return 0
  const prev = new Set(previous.numbers)
  return current.numbers.filter((n) => prev.has(n)).length
}

function listRepeatNumbers(current, previous) {
  if (!previous) return []
  const prev = new Set(previous.numbers)
  return current.numbers.filter((n) => prev.has(n)).sort((a, b) => a - b)
}

export function buildReportSnapshot(records, { trendWindow = 30, sampleWindow = 100 } = {}) {
  if (!records.length) return null

  const { items: omissionItems } = buildOmissionSummary(records)
  const recent = records.slice(0, trendWindow)
  const sample = records.slice(0, Math.min(sampleWindow, records.length))
  const chronological = [...recent].reverse()
  const latest = records[0]
  const prev = records[1] || null

  const freq = Array.from({ length: 80 }, (_, i) => ({
    num: i + 1,
    count: 0,
    currentOmission: omissionItems[i].currentOmission,
    avgOmission: omissionItems[i].avgOmission,
  }))
  for (const r of recent) {
    for (const num of r.numbers) {
      freq[num - 1].count += 1
    }
  }

  const omissionRank = [...omissionItems]
    .sort((a, b) => b.currentOmission - a.currentOmission)
    .slice(0, 15)
    .map((item) => ({
      ...item,
      recentAppear: freq[item.num - 1].count,
    }))

  const hot = [...freq]
    .filter((f) => f.count >= 8)
    .sort((a, b) => b.count - a.count || a.currentOmission - b.currentOmission)
    .slice(0, 10)

  const cold = [...freq]
    .filter((f) => f.currentOmission >= 8)
    .sort((a, b) => b.currentOmission - a.currentOmission || a.count - b.count)
    .slice(0, 10)

  const repeatTrend = chronological.map((r, i) => ({
    issue: r.issue,
    value: countRepeat(r, i > 0 ? chronological[i - 1] : null),
  }))

  const consecutiveTrend = chronological.map((r) => ({
    issue: r.issue,
    value: countConsecutiveGroups(r.numbers),
  }))

  const sumTrend = chronological.map((r) => ({
    issue: r.issue,
    value: calcSum(r.numbers),
  }))

  const oddTrend = chronological.map((r) => ({
    issue: r.issue,
    odd: countOdd(r.numbers),
    even: 20 - countOdd(r.numbers),
  }))

  const sizeTrend = chronological.map((r) => {
    const small = r.numbers.filter((n) => n <= 40).length
    return { issue: r.issue, small, big: 20 - small }
  })

  const sumZones = [
    { label: '偏低', hint: '≤750', count: 0 },
    { label: '居中', hint: '751-870', count: 0 },
    { label: '偏高', hint: '≥871', count: 0 },
  ]
  for (const r of sample) {
    const sum = calcSum(r.numbers)
    if (sum <= 750) sumZones[0].count += 1
    else if (sum <= 870) sumZones[1].count += 1
    else sumZones[2].count += 1
  }

  const zoneLatest = countZoneHits(latest.numbers)
  const zoneAvg = ZONES.map((z, zi) => {
    const total = recent.reduce(
      (sum, r) => sum + r.numbers.filter((n) => n >= z.min && n <= z.max).length,
      0,
    )
    return {
      ...z,
      avg: +(total / recent.length).toFixed(1),
      latest: zoneLatest[zi].count,
    }
  })

  const highOmissionCount = omissionItems.filter((i) => i.currentOmission >= 15).length
  const deepColdCount = omissionItems.filter((i) => i.currentOmission >= 20).length
  const latestConsecutiveGroups = listConsecutiveGroups(latest.numbers)
  const deepColdNumbers = omissionItems
    .filter((i) => i.currentOmission >= 20)
    .sort((a, b) => b.currentOmission - a.currentOmission)
    .map((i) => i.num)

  return {
    overview: {
      totalIssues: records.length,
      latestIssue: latest.issue,
      latestDate: latest.date,
      trendWindow,
      sampleWindow: sample.length,
      latestSum: calcSum(latest.numbers),
      latestOdd: countOdd(latest.numbers),
      latestSmall: latest.numbers.filter((n) => n <= 40).length,
      latestRepeat: countRepeat(latest, prev),
      latestRepeatNumbers: listRepeatNumbers(latest, prev),
      latestConsecutive: latestConsecutiveGroups.length,
      latestConsecutiveGroups,
      highOmissionCount,
      deepColdCount,
    },
    deepColdNumbers,
    omissionRank,
    hot,
    cold,
    repeatTrend,
    consecutiveTrend,
    sumTrend,
    oddTrend,
    sizeTrend,
    sumZones,
    zoneAvg,
    maxOmission: omissionRank[0]?.currentOmission || 1,
    maxHotCount: hot[0]?.count || 1,
    maxSumZone: Math.max(...sumZones.map((z) => z.count), 1),
    maxZoneLatest: Math.max(...zoneLatest.map((z) => z.count), 1),
    sumTrendMin: Math.min(...sumTrend.map((p) => p.value)),
    sumTrendMax: Math.max(...sumTrend.map((p) => p.value)),
    maxRepeat: Math.max(...repeatTrend.map((p) => p.value), 1),
    maxConsecutive: Math.max(...consecutiveTrend.map((p) => p.value), 1),
  }
}

export function buildChartSeries(
  data,
  {
    width,
    height,
    padding = { top: 10, right: 10, bottom: 4, left: 28 },
    mode = 'line',
    minY,
    maxY,
  } = {},
) {
  if (!data.length) {
    return { coords: [], polyline: '', min: 0, max: 0 }
  }

  const values = data.map((d) => d.value)
  const min = minY ?? Math.min(...values)
  const max = maxY ?? Math.max(...values)
  const range = max - min || 1
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const coords = data.map((d, i) => {
    let x
    let barX
    let barWidth
    let barHeight
    const bottom = padding.top + innerH

    if (mode === 'bar') {
      const step = innerW / data.length
      barWidth = Math.max(2, step * 0.62)
      x = padding.left + i * step + step / 2
      barX = x - barWidth / 2
    } else {
      x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW
    }

    const y = padding.top + innerH - ((d.value - min) / range) * innerH
    if (mode === 'bar') {
      barHeight = Math.max(0, bottom - y)
    }

    return {
      ...d,
      x,
      y,
      index: i,
      ...(mode === 'bar' ? { barX, barY: y, barWidth, barHeight } : {}),
    }
  })

  return {
    coords,
    polyline: coords.map((c) => `${c.x},${c.y}`).join(' '),
    min,
    max,
    padding,
    width,
    height,
  }
}

export function lineChartPoints(values, width, height, padding = 8) {
  if (!values.length) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  return values
    .map((v, i) => {
      const x = padding + (i / Math.max(values.length - 1, 1)) * innerW
      const y = padding + innerH - ((v - min) / range) * innerH
      return `${x},${y}`
    })
    .join(' ')
}

export function barChartPoints(values, width, height, padding = 8) {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const step = innerW / values.length

  return values
    .map((v, i) => {
      const x = padding + i * step + step / 2
      const y = padding + innerH - (v / max) * innerH
      return `${x},${y}`
    })
    .join(' ')
}
