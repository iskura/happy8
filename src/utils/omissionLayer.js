/**
 * 当前连续遗漏段（与标注「遗漏分层」相同）
 * @returns {{ layerKeys: Set<string>, omissionByNum: Map<number, number> }}
 */
export function buildCurrentOmissionStreak(rows) {
  const layerKeys = new Set()
  const omissionByNum = new Map()

  if (!rows?.length) return { layerKeys, omissionByNum }

  let latestRow = rows[0]
  for (const row of rows) {
    if (Number(row.issue) > Number(latestRow.issue)) latestRow = row
  }

  const sortedRows = [...rows].sort((a, b) => Number(a.issue) - Number(b.issue))
  const latestIndex = sortedRows.findIndex((row) => row.issue === latestRow.issue)
  if (latestIndex < 0) return { layerKeys, omissionByNum }

  for (const cell of latestRow.cells) {
    const num = cell.num
    const latestCell = latestRow.cells.find((item) => item.num === num)
    if (!latestCell || latestCell.type === 'hit') continue

    let expected = latestCell.omission
    let inStreak = false

    for (let i = latestIndex; i >= 0; i -= 1) {
      const row = sortedRows[i]
      const rowCell = row.cells.find((item) => item.num === num)
      if (!rowCell || rowCell.type === 'hit') break
      if (rowCell.omission !== expected) break

      layerKeys.add(`${row.issue}__${num}`)
      inStreak = true
      if (expected <= 1) break
      expected -= 1
    }

    if (inStreak) omissionByNum.set(num, latestCell.omission)
  }

  return { layerKeys, omissionByNum }
}

export function getPredictionOmitTone(omission) {
  return omission <= 5 ? 'low' : 'high'
}
