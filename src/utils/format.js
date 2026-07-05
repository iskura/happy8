export function formatBall(num) {
  return String(num).padStart(2, '0')
}

export function formatBalls(nums) {
  return nums.map((num) => formatBall(num)).join(' ')
}

export function parseBallInput(text, max = 80) {
  const tokens = String(text || '')
    .trim()
    .split(/[\s,，;；]+/)
    .filter(Boolean)
  const numbers = []
  const seen = new Set()

  for (const token of tokens) {
    const num = Number.parseInt(token, 10)
    if (!Number.isFinite(num) || num < 1 || num > max || seen.has(num)) continue
    seen.add(num)
    numbers.push(num)
  }

  return numbers.sort((a, b) => a - b)
}

export async function copyText(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  }
}
