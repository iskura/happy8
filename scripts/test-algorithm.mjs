import { parseKl8Text } from '../src/api/lottery.js'
import { analyzeNumbers, findClosestNumbers, reverseBySpan, wrapNumber } from '../src/utils/numberPicker.js'
import assert from 'node:assert/strict'

// 基础工具函数
assert.equal(reverseBySpan(5, 2), 3)
assert.equal(reverseBySpan(5, 6), 79)
assert.equal(wrapNumber(-2), 78)

// 邻号选取
const closest = findClosestNumbers(5, [1, 7, 20, 35])
assert.deepEqual(
  closest.map((item) => item.num),
  [7],
)

// 用最新真实数据跑一遍，确保不抛错
const fs = await import('node:fs')
const text = fs.readFileSync(new URL('../public/data/kl8.txt', import.meta.url), 'utf8')
const records = parseKl8Text(text)
const result = analyzeNumbers(records, 10)

assert.ok(result.classA.length >= 0)
assert.ok(result.classB.length >= 0)
assert.ok(result.steps.length > 0)
assert.equal(result.current.issue, records[0].issue)

console.log('算法测试通过')
console.log(`最新期号: ${result.current.issue}`)
console.log(`A类(${result.classA.length}): ${result.classAFormatted.join(', ')}`)
console.log(`B类(${result.classB.length}): ${result.classBFormatted.join(', ')}`)
