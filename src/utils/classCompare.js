export function getClassNonOverlapNums(classItems, predictionNumbers) {
  const classSet = new Set((classItems || []).map((item) => item.num))
  return [...(predictionNumbers || [])]
    .filter((num) => !classSet.has(num))
    .sort((a, b) => a - b)
}
