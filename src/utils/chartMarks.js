function getRowValues(row) {
  return row.activeCols || row.numbers || []
}

/**
 * 计算每期标注：重号、连号、边号
 */
export function computeRowMarks(row, prevRow, maxCol = 80) {
  const current = getRowValues(row)
  const previous = prevRow ? getRowValues(prevRow) : []
  const repeat = new Set()
  const consecutive = new Set()
  const edge = new Set()

  for (const num of current) {
    if (previous.includes(num)) repeat.add(num)
  }

  const sorted = [...current].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (sorted[i + 1] - sorted[i] === 1) {
      consecutive.add(sorted[i])
      consecutive.add(sorted[i + 1])
    }
  }

  for (const num of current) {
    if (num > 1) edge.add(num - 1)
    if (num < maxCol) edge.add(num + 1)
  }

  return { repeat, consecutive, edge }
}

export function attachMarksToRows(rows, maxCol = 80) {
  return rows.map((row, index) => {
    const prevRow = rows[index + 1]
    const marks = computeRowMarks(row, prevRow, maxCol)
    return { ...row, marks }
  })
}

export function getCellMarkClass(cell, rowMarks, markToggles) {
  if (!rowMarks) return []

  const classes = []
  const num = cell.num

  if (cell.type === 'hit') {
    if (markToggles.repeat && rowMarks.repeat.has(num)) classes.push('mark-repeat')
    if (markToggles.consecutive && rowMarks.consecutive.has(num)) classes.push('mark-consecutive')
  }

  if (markToggles.edge && rowMarks.edge.has(num)) classes.push('mark-edge')

  return classes
}
