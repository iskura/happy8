import { formatBall } from './format.js'

/**
 * 将号码限制在 01-80 范围内（环形）
 */
export function wrapNumber(num) {
  let value = num
  while (value < 1) value += 80
  while (value > 80) value -= 80
  return value
}

/**
 * 在下一期开奖号中，找出与目标号跨度最小的相邻号
 */
export function findClosestNumbers(target, nextNumbers) {
  let minSpan = Infinity

  for (const num of nextNumbers) {
    const span = Math.abs(num - target)
    if (span < minSpan) minSpan = span
  }

  if (minSpan === Infinity) return []

  return nextNumbers
    .filter((num) => Math.abs(num - target) === minSpan)
    .map((num) => ({ num, span: minSpan }))
}

/**
 * 按邻号反选：源号 - (邻号 - 源号)
 * 例：源号 72，邻号 70 → 72-(70-72)=74；邻号 74 → 72-(74-72)=70
 */
export function reverseByAdjacent(source, adjacent) {
  return wrapNumber(source - (adjacent - source))
}

/** @deprecated 使用 reverseByAdjacent，保留兼容旧测试引用 */
export function reverseBySpan(target, span) {
  return wrapNumber(target - span)
}

function addPick(pickMap, num, trace) {
  if (!Number.isFinite(num)) return
  const key = num
  if (!pickMap.has(key)) {
    pickMap.set(key, { num, count: 0, traces: [] })
  }
  const item = pickMap.get(key)
  item.count += 1
  item.traces.push(trace)
}

/** 同一源号、同一命中期只计一次，避免邻号/反选重复累加 */
function addPeriodPicks(pickMap, sourceNumber, hitRecord, nextRecord, closestList) {
  const periodNumbers = new Map()

  for (const { num: adjacent, span } of closestList) {
    const reverse = reverseByAdjacent(sourceNumber, adjacent)
    const traceBase = {
      sourceNumber,
      hitPeriod: hitRecord.issue,
      nextPeriod: nextRecord.issue,
      adjacent,
      span,
      reverse,
    }

    if (!periodNumbers.has(adjacent)) {
      periodNumbers.set(adjacent, { ...traceBase, type: 'adjacent' })
    }
    if (!periodNumbers.has(reverse)) {
      periodNumbers.set(reverse, { ...traceBase, type: 'reverse' })
    }
  }

  for (const trace of periodNumbers.values()) {
    addPick(pickMap, trace.type === 'adjacent' ? trace.adjacent : trace.reverse, trace)
  }

  return closestList.map(({ num: adjacent, span }) => ({
    sourceNumber,
    hitPeriod: hitRecord.issue,
    nextPeriod: nextRecord.issue,
    adjacent,
    span,
    reverse: reverseByAdjacent(sourceNumber, adjacent),
  }))
}

/** 冷号统计窗口：选中开奖期之前的期数 */
export const COLD_NUMBER_WINDOW = 30

/** 冷号阈值：出现次数少于该值（即 < 5 次） */
export const COLD_NUMBER_THRESHOLD = 5

/**
 * 冷号：选中开奖期之前 windowSize 期内，出现次数少于 threshold 次的号码
 * @param {Array} records 按期号倒序（最新在前）
 * @param {string|null} baseIssue 基准期号
 */
export function getColdNumbers(
  records,
  baseIssue = null,
  windowSize = COLD_NUMBER_WINDOW,
  threshold = COLD_NUMBER_THRESHOLD,
) {
  if (!records.length) return []

  let currentIndex = 0
  if (baseIssue != null && baseIssue !== '') {
    currentIndex = records.findIndex((record) => record.issue === String(baseIssue))
    if (currentIndex < 0) return []
  }

  const prior = records.slice(currentIndex + 1, currentIndex + 1 + windowSize)
  const counts = new Map()
  for (let num = 1; num <= 80; num += 1) counts.set(num, 0)

  for (const record of prior) {
    for (const num of record.numbers) {
      counts.set(num, (counts.get(num) || 0) + 1)
    }
  }

  const cold = []
  for (let num = 1; num <= 80; num += 1) {
    if ((counts.get(num) || 0) < threshold) cold.push(num)
  }
  return cold
}

/**
 * 核心选号逻辑
 * @param {Array} records 按期号倒序（最新在前）
 * @param {number} lookback 往前追溯期数，默认 9
 * @param {string|null} baseIssue 基准期号，默认最新一期
 */
export function analyzeNumbers(records, lookback = 9, baseIssue = null) {
  if (!records.length) {
    throw new Error('暂无开奖数据')
  }

  let currentIndex = 0
  if (baseIssue != null && baseIssue !== '') {
    currentIndex = records.findIndex((record) => record.issue === String(baseIssue))
    if (currentIndex < 0) {
      throw new Error(`未找到期号 ${baseIssue}`)
    }
  }

  const availableLookback = records.length - currentIndex - 1
  if (availableLookback < 1) {
    throw new Error(`期号 ${records[currentIndex].issue} 之前没有足够历史数据`)
  }

  const effectiveLookback = Math.min(lookback, availableLookback)
  const current = records[currentIndex]
  const history = records.slice(currentIndex + 1, currentIndex + 1 + effectiveLookback)
  const pickMap = new Map()
  const steps = []
  const sourceDetails = []

  for (const sourceNumber of current.numbers) {
    const rows = []

    for (let i = 0; i < history.length; i += 1) {
      const hitRecord = history[i]
      const row = {
        sourceNumber,
        lookbackStep: i + 1,
        hitPeriod: hitRecord.issue,
        hitDate: hitRecord.date,
        hit: hitRecord.numbers.includes(sourceNumber),
        nextPeriod: '',
        nextDate: '',
        nextNumbers: [],
        adjacentList: [],
        span: null,
        reverse: null,
        status: 'miss',
        statusText: '该期未开出源号',
      }

      if (!row.hit) {
        rows.push(row)
        continue
      }

      const hitIndex = records.indexOf(hitRecord)
      if (hitIndex <= 0) {
        row.status = 'skip'
        row.statusText = '无下一期数据'
        rows.push(row)
        continue
      }

      const nextRecord = records[hitIndex - 1]
      row.nextPeriod = nextRecord.issue
      row.nextDate = nextRecord.date
      row.nextNumbers = [...nextRecord.numbers]
      const closestList = findClosestNumbers(sourceNumber, nextRecord.numbers)

      if (!closestList.length) {
        row.status = 'skip'
        row.statusText = '无法计算邻号'
        rows.push(row)
        continue
      }

      row.adjacentList = closestList.map(({ num, span }) => ({
        adjacent: num,
        span,
        reverse: reverseByAdjacent(sourceNumber, num),
      }))
      row.span = closestList[0].span
      row.reverse = row.adjacentList[0].reverse
      row.status = 'hit'
      row.statusText = closestList.length > 1 ? `命中，${closestList.length} 个最小跨度邻号` : '命中并产生选号'

      const traces = addPeriodPicks(
        pickMap,
        sourceNumber,
        hitRecord,
        nextRecord,
        closestList,
      )
      steps.push(...traces)

      rows.push(row)
    }

    sourceDetails.push({
      sourceNumber,
      rows,
    })
  }

  const allPicks = [...pickMap.values()].sort((a, b) => a.num - b.num)
  const classA = allPicks.filter((item) => item.count > 1)
  const classB = allPicks.filter((item) => item.count === 1)
  const coldNumberSet = new Set(getColdNumbers(records, current.issue))
  const classBCold = classB.filter((item) => coldNumberSet.has(item.num))

  return {
    current,
    lookback: effectiveLookback,
    requestedLookback: lookback,
    steps,
    sourceDetails,
    classA,
    classB,
    classBCold,
    coldNumbers: [...coldNumberSet].sort((a, b) => a - b),
    classAFormatted: classA.map((item) => formatBall(item.num)),
    classBFormatted: classB.map((item) => formatBall(item.num)),
    classBColdFormatted: classBCold.map((item) => formatBall(item.num)),
    totalPicks: allPicks.length,
  }
}
