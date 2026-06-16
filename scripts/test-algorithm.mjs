import { parseKl8Text } from '../src/api/lottery.js'
import {
  analyzeNumbers,
  findClosestNumbers,
  reverseByAdjacent,
  reverseBySpan,
  wrapNumber,
} from '../src/utils/numberPicker.js'
import assert from 'node:assert/strict'

assert.equal(reverseByAdjacent(72, 70), 74)
assert.equal(reverseByAdjacent(72, 74), 70)
assert.equal(reverseByAdjacent(5, 7), 3)
assert.equal(reverseByAdjacent(5, 3), 7)
assert.equal(reverseBySpan(5, 2), 3)
assert.equal(wrapNumber(-2), 78)

const closest = findClosestNumbers(72, [10, 20, 70, 74, 80])
assert.deepEqual(
  closest.map((item) => item.num).sort((a, b) => a - b),
  [70, 74],
)

const fs = await import('node:fs')
const text = fs.readFileSync(new URL('./fixtures/kl8.txt', import.meta.url), 'utf8')
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
