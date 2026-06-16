/** 轻量 canvas 烟花 — 360° 球面爆炸，伪 3D 深度 + 重力下落 */
export function launchFireworks(durationMs = 11000) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText =
    'position:fixed;inset:0;z-index:100100;pointer-events:none;width:100%;height:100%'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  let width = 0
  let height = 0
  let frameId = 0
  let startTime = 0
  let exploded = false

  const particles = []
  const trail = []
  const colors = ['#fb7185', '#f472b6', '#fbbf24', '#fde68a', '#34d399', '#60a5fa', '#c084fc', '#f97316']

  const GRAVITY = 0.032
  const AIR_DRAG = 0.995
  const POST_BURST_SPEED = 0.72

  const rocket = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    progress: 0,
    active: true,
  }

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height

    if (!startTime) {
      rocket.x = width * 0.5
      rocket.y = height - 24
      rocket.targetX = width * 0.5
      rocket.targetY = height * 0.38
    }
  }

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3
  }

  /** 球面均匀采样 → 屏幕 xy + 纵深 z，360° 含下方 */
  function addSphereSpark(x, y, speed, opts) {
    const theta = Math.random() * Math.PI * 2
    const cosPhi = Math.random() * 2 - 1
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi))

    const wx = sinPhi * Math.cos(theta)
    const wy = cosPhi
    const wz = sinPhi * Math.sin(theta)

    particles.push({
      x,
      y,
      z: 0,
      vx: wx * speed,
      vy: -wy * speed,
      vz: wz * speed * 0.55,
      life: 1,
      decay: opts.decay,
      color: opts.color,
      length: opts.length,
      width: opts.width,
      kind: opts.kind,
      dotSize: opts.dotSize,
    })
  }

  function sparkOpts(color, length, width) {
    const isDot = Math.random() < 0.42
    return {
      decay: isDot
        ? 0.0007 + Math.random() * 0.001
        : 0.0008 + Math.random() * 0.0012,
      color,
      length,
      width,
      kind: isDot ? 'dot' : 'streak',
      dotSize: 1.2 + Math.random() * 1.6,
    }
  }

  function bigBurst(x, y) {
    const count = 180
    for (let i = 0; i < count; i += 1) {
      addSphereSpark(x, y, 2.6 + Math.random() * 4.8, sparkOpts(
        colors[Math.floor(Math.random() * colors.length)],
        5 + Math.random() * 7,
        1 + Math.random() * 0.7,
      ))
    }

    for (let i = 0; i < 40; i += 1) {
      addSphereSpark(x, y, 6.5 + Math.random() * 3, sparkOpts(
        colors[i % colors.length],
        7 + Math.random() * 5,
        1.1 + Math.random() * 0.6,
      ))
    }
  }

  function depthFactor(z) {
    return 0.52 + 0.48 * Math.max(-1, Math.min(1, z / 90))
  }

  function drawStreak(x, y, dx, dy, color, alpha, lineWidth) {
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const streakLen = lineWidth * 3 + 4

    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - ux * streakLen, y - uy * streakLen)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function updateRocket(elapsed) {
    const riseDuration = 1800
    rocket.progress = Math.min(elapsed / riseDuration, 1)
    const t = easeOutCubic(rocket.progress)

    const startX = width * 0.5
    const startY = height - 24
    const prevY = rocket.y
    rocket.x = startX + (rocket.targetX - startX) * t
    rocket.y = startY + (rocket.targetY - startY) * t

    trail.push({
      x: rocket.x,
      y: rocket.y,
      dy: rocket.y - prevY,
      life: 1,
    })
    if (trail.length > 18) trail.shift()

    if (rocket.progress >= 1 && !exploded) {
      exploded = true
      rocket.active = false
      bigBurst(rocket.targetX, rocket.targetY)
    }
  }

  function drawRocket() {
    for (let i = 0; i < trail.length; i += 1) {
      const t = trail[i]
      t.life -= 0.022
      if (t.life <= 0) continue

      drawStreak(t.x, t.y + 4, 0, Math.max(t.dy, 2), '#fde68a', t.life * 0.55, 1.2 * t.life)
    }

    drawStreak(rocket.x, rocket.y, 0, -1, '#fff7ed', 1, 2)
    drawStreak(rocket.x, rocket.y, 0, -1, '#fbbf24', 0.7, 1.2)
  }

  function drawSpark(p) {
    const depth = depthFactor(p.z)
    const alpha = Math.max(p.life, 0) * depth
    const sizeScale = 0.88 + depth * 0.12

    if (p.kind === 'dot') {
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.dotSize * Math.max(p.life, 0.35) * sizeScale, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    const speed = Math.hypot(p.vx, p.vy) || 1
    const streakLen = p.length * p.life
    const dx = (p.vx / speed) * streakLen
    const dy = (p.vy / speed) * streakLen

    ctx.globalAlpha = alpha
    ctx.strokeStyle = p.color
    ctx.lineWidth = p.width * Math.max(p.life, 0.35) * sizeScale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p.x - dx, p.y - dy)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  function tick(now) {
    if (!startTime) startTime = now
    const elapsed = now - startTime

    ctx.clearRect(0, 0, width, height)

    if (rocket.active) {
      updateRocket(elapsed)
      drawRocket()
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i]
      const move = exploded ? POST_BURST_SPEED : 1
      p.x += (p.vx + p.vz * 0.08) * move
      p.y += p.vy * move
      p.z += p.vz * move
      p.vx *= AIR_DRAG
      p.vy *= AIR_DRAG
      p.vz *= AIR_DRAG
      p.vy += GRAVITY * move
      p.life -= p.decay

      if (p.life <= 0) {
        particles.splice(i, 1)
      }
    }

    particles.sort((a, b) => a.z - b.z)
    for (let i = 0; i < particles.length; i += 1) {
      drawSpark(particles[i])
    }

    ctx.globalAlpha = 1

    if (elapsed < durationMs || particles.length > 0 || rocket.active) {
      frameId = window.requestAnimationFrame(tick)
    } else {
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }

  resize()
  window.addEventListener('resize', resize)
  frameId = window.requestAnimationFrame(tick)
}
