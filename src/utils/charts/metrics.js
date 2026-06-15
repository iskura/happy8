export function calcSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0)
}

export function calcSpan(numbers) {
  return Math.max(...numbers) - Math.min(...numbers)
}

export function calcMean(numbers) {
  return Math.round(calcSum(numbers) / numbers.length)
}

export function tail(value) {
  return Math.abs(value) % 10
}

export function countOdd(numbers) {
  return numbers.filter((num) => num % 2 === 1).length
}

export function countEven(numbers) {
  return numbers.length - countOdd(numbers)
}

export function getHead(num) {
  if (num < 10) return 0
  return Math.floor(num / 10)
}

export function countByHead(numbers) {
  const counts = Array.from({ length: 9 }, () => 0)
  for (const num of numbers) {
    counts[getHead(num)] += 1
  }
  return counts
}

export function countByTailDigit(numbers) {
  const counts = Array.from({ length: 10 }, () => 0)
  for (const num of numbers) {
    counts[num % 10] += 1
  }
  return counts
}

export function getTrend(prev, current) {
  if (current > prev) return 0 // 升
  if (current === prev) return 1 // 平
  return 2 // 降
}

export function isTailBig(tailValue) {
  return tailValue >= 5
}

const PRIME_SUM_TAIL = new Set([1, 2, 3, 5, 7])

export function isSumTailEven(sumTail) {
  return sumTail % 2 === 0
}

export function isSumTailPrime(sumTail) {
  return PRIME_SUM_TAIL.has(sumTail)
}

export function sumTailRoad(sumTail) {
  return sumTail % 3
}
