export function formatBall(num) {
  return String(num).padStart(2, '0')
}

export function formatBalls(nums) {
  return nums.map((num) => formatBall(num)).join(', ')
}
