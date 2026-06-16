import { parseKl8Text } from '../src/api/lottery.js'
import { buildDistribution } from '../src/utils/distribution.js'
import fs from 'node:fs'

const text = fs.readFileSync('scripts/fixtures/kl8.txt', 'utf8')
const records = parseKl8Text(text)
const chart = buildDistribution(records, 30)

console.log('rows', chart.rows.length)
console.log('first issue', chart.rows[0]?.issue)
console.log('sample cell hit', chart.rows[0]?.cells.find((c) => c.type === 'hit'))
console.log('sample cell miss', chart.rows[0]?.cells.find((c) => c.type === 'miss'))
console.log('stats appear 07', chart.stats.appearCount[7])
console.log('stats current omit 07', chart.stats.currentOmission[7])
