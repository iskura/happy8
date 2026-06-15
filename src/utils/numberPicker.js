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
 * 反向数相同跨度
 */
export function reverseBySpan(target, span) {
  return wrapNumber(target - span)
}

function addPick(pickMap, num, trace) {
  const key = num
  if (!pickMap.has(key)) {
    pickMap.set(key, { num, count: 0, traces: [] })
  }
  const item = pickMap.get(key)
  item.count += 1
  item.traces.push(trace)
}

/**
 * 核心选号逻辑
 * @param {Array} records 按期号倒序（最新在前）
 * @param {number} lookback 往前追溯期数，默认 10
 * @param {string|null} baseIssue 基准期号，默认最新一期
 */
export function analyzeNumbers(records, lookback = 10, baseIssue = null) {
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

  for (const sourceNumber of current.numbers) {
    for (let i = 0; i < history.length; i += 1) {
      const hitRecord = history[i]
      if (!hitRecord.numbers.includes(sourceNumber)) continue

      const hitIndex = records.indexOf(hitRecord)
      if (hitIndex <= 0) continue

      const nextRecord = records[hitIndex - 1]
      const closestList = findClosestNumbers(sourceNumber, nextRecord.numbers)
      if (!closestList.length) continue

      for (const { num: adjacent, span } of closestList) {
        const reverse = reverseBySpan(sourceNumber, span)
        const trace = {
          sourceNumber,
          hitPeriod: hitRecord.issue,
          nextPeriod: nextRecord.issue,
          adjacent,
          span,
          reverse,
        }

        addPick(pickMap, adjacent, { ...trace, type: 'adjacent' })
        addPick(pickMap, reverse, { ...trace, type: 'reverse' })

        steps.push(trace)
      }
    }
  }

  const allPicks = [...pickMap.values()].sort((a, b) => a.num - b.num)
  const classA = allPicks.filter((item) => item.count > 1)
  const classB = allPicks.filter((item) => item.count === 1)

  return {
    current,
    lookback: effectiveLookback,
    requestedLookback: lookback,
    steps,
    classA,
    classB,
    classAFormatted: classA.map((item) => formatBall(item.num)),
    classBFormatted: classB.map((item) => formatBall(item.num)),
    totalPicks: allPicks.length,
  }
}
