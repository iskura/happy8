import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_URL = 'https://data.17500.cn/kl8_desc.txt'
const OUTPUT = join(__dirname, 'fixtures/kl8.txt')

async function main() {
  console.log('正在拉取快乐8开奖数据...')
  const response = await fetch(DATA_URL)
  if (!response.ok) {
    throw new Error(`拉取失败: ${response.status}`)
  }
  const text = await response.text()
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, text, 'utf8')
  const lines = text.trim().split('\n').filter(Boolean)
  console.log(`已保存 ${lines.length} 期数据到 scripts/fixtures/kl8.txt`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
