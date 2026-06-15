/**
 * 按期号排序开奖记录
 * @param {'desc'|'asc'} order desc=最新在前（默认倒序）
 */
export function sortRecordsByIssue(records, order = 'desc') {
  return [...records].sort((a, b) => {
    const diff = Number(b.issue) - Number(a.issue)
    return order === 'desc' ? diff : -diff
  })
}
