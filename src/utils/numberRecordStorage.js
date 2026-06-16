const STORAGE_KEY = 'happy8-number-records'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStore(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 存储失败时静默忽略
  }
}

export function loadNumberRecords() {
  return readStore().sort((a, b) => {
    const issueA = Number.parseInt(a.issue, 10) || 0
    const issueB = Number.parseInt(b.issue, 10) || 0
    return issueB - issueA
  })
}

export function saveNumberRecords(records) {
  writeStore(records)
}

export function createNumberRecord({ issue, spent, numberCount, profit, note = '' }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    issue: String(issue).trim(),
    spent: Number(spent) || 0,
    numberCount: Number(numberCount) || 0,
    profit: Number(profit) || 0,
    note: String(note || '').trim(),
    createdAt: new Date().toISOString(),
  }
}

export function addNumberRecord(record) {
  const records = loadNumberRecords()
  records.unshift(record)
  saveNumberRecords(records)
  return records
}

export function deleteNumberRecord(id) {
  const records = loadNumberRecords().filter((item) => item.id !== id)
  saveNumberRecords(records)
  return records
}

export function buildNumberRecordStats(records) {
  const totalSpent = records.reduce((sum, item) => sum + (Number(item.spent) || 0), 0)
  const totalProfit = records.reduce((sum, item) => sum + (Number(item.profit) || 0), 0)
  const totalNumbers = records.reduce((sum, item) => sum + (Number(item.numberCount) || 0), 0)
  const totalIssues = records.length
  const winCount = records.filter((item) => (Number(item.profit) || 0) > 0).length

  return {
    totalIssues,
    totalSpent,
    totalProfit,
    avgNumbers: totalIssues ? totalNumbers / totalIssues : 0,
    winCount,
    loseCount: records.filter((item) => (Number(item.profit) || 0) < 0).length,
  }
}
