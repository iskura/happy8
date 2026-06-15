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
 */
export function analyzeNumbers(records, lookback = 10) {
  if (!records.length) {
    throw new Error('暂无开奖数据')
  }

  const current = records[0]
  const history = records.slice(1, lookback + 1)
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
    lookback,
    steps,
    classA,
    classB,
    classAFormatted: classA.map((item) => formatBall(item.num)),
    classBFormatted: classB.map((item) => formatBall(item.num)),
    totalPicks: allPicks.length,
  }
}
