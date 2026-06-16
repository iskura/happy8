import * as XLSX from 'xlsx'
import { buildNumberRecordStats } from './numberRecordStorage.js'

function formatRecordDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildFileName() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `快乐8号码记录_${stamp}.xlsx`
}

export function exportNumberRecordsToExcel(records) {
  const sorted = [...records].sort((a, b) => {
    const issueA = Number.parseInt(a.issue, 10) || 0
    const issueB = Number.parseInt(b.issue, 10) || 0
    return issueB - issueA
  })

  const rows = sorted.map((item) => ({
    期号: item.issue,
    '投入(元)': Number(item.spent) || 0,
    注数: Number(item.numberCount) || 0,
    '盈亏(元)': Number(item.profit) || 0,
    备注: item.note || '',
    记录日期: formatRecordDate(item.createdAt),
  }))

  const stats = buildNumberRecordStats(sorted)
  const summaryRows = [
    {},
    { 期号: '统计汇总' },
    { 期号: '记录期数', 注数: stats.totalIssues },
    { 期号: '总投入(元)', '投入(元)': Number(stats.totalSpent.toFixed(2)) },
    { 期号: '总盈亏(元)', '盈亏(元)': Number(stats.totalProfit.toFixed(2)) },
    { 期号: '平均注数', 注数: Number(stats.avgNumbers.toFixed(1)) },
    { 期号: '盈利期数', 注数: stats.winCount },
    { 期号: '亏损期数', 注数: stats.loseCount },
  ]

  const sheet = XLSX.utils.json_to_sheet([...rows, ...summaryRows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '号码记录')
  XLSX.writeFile(workbook, buildFileName())
}
