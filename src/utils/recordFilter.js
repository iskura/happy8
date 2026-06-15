import { sortRecordsByIssue } from './sortRecords.js'

function getWeekdayIndex(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay()
}

function getIssueTail(issue) {
  return Number.parseInt(String(issue).slice(-1), 10)
}

/**
 * 按原站条件筛选开奖记录（最新在前）
 */
export function filterRecords(records, filters = {}) {
  let result = [...records]

  if (filters.weekdays?.length) {
    const set = new Set(filters.weekdays)
    result = result.filter((record) => set.has(getWeekdayIndex(record.date)))
  }

  if (filters.issueParity === 'odd') {
    result = result.filter((record) => getIssueTail(record.issue) % 2 === 1)
  } else if (filters.issueParity === 'even') {
    result = result.filter((record) => getIssueTail(record.issue) % 2 === 0)
  }

  if (filters.issueTails?.length) {
    const set = new Set(filters.issueTails)
    result = result.filter((record) => set.has(getIssueTail(record.issue)))
  }

  if (filters.years?.length) {
    const set = new Set(filters.years.map(String))
    result = result.filter((record) => set.has(record.date.slice(0, 4)))
  }

  if (filters.months?.length) {
    const set = new Set(filters.months)
    result = result.filter((record) => set.has(Number.parseInt(record.date.slice(5, 7), 10)))
  }

  if (filters.days?.length) {
    const set = new Set(filters.days)
    result = result.filter((record) => set.has(Number.parseInt(record.date.slice(8, 10), 10)))
  }

  if (filters.issueStart) {
    result = result.filter((record) => record.issue >= filters.issueStart)
  }

  if (filters.issueEnd) {
    result = result.filter((record) => record.issue <= filters.issueEnd)
  }

  if (filters.periodCount > 0) {
    result = result.slice(0, filters.periodCount)
  }

  return sortRecordsByIssue(result, 'desc')
}

export function getAvailableYears(records) {
  const years = new Set(records.map((record) => record.date.slice(0, 4)))
  return [...years].sort((a, b) => Number(b) - Number(a))
}
