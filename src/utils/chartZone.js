export function isZoneBoundaryCol(colNum, chart) {
  const zoneEvery = chart.zoneEvery || 0
  if (!zoneEvery || colNum <= 1) return false
  const zoneMax = chart.zoneEveryMaxCol ?? chart.columnCount
  if (colNum > zoneMax) return false
  return (colNum - 1) % zoneEvery === 0
}
