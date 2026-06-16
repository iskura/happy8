import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const root = join(import.meta.dirname, '..')

const replacements = [
  [/#fff\b/g, 'var(--color-surface)'],
  [/#ffffff\b/gi, 'var(--color-white)'],
  [/#f8fafc\b/g, 'var(--color-surface-alt)'],
  [/#f1f5f9\b/g, 'var(--color-surface-muted)'],
  [/#fafbfc\b/g, 'var(--color-nav-bg)'],
  [/#e2e8f0\b/g, 'var(--border)'],
  [/#cbd5e1\b/g, 'var(--border-strong)'],
  [/#d8dee9\b/g, 'var(--border-input)'],
  [/#1677ff\b/g, 'var(--link)'],
  [/#7cb3ff\b/g, 'var(--link-hover-border)'],
  [/#91caff\b/g, 'var(--link-border)'],
  [/#f0f7ff\b/g, 'var(--link-bg)'],
  [/#e6f4ff\b/g, 'var(--link-bg-active)'],
  [/#16a34a\b/g, 'var(--success)'],
  [/#f0fdf4\b/g, 'var(--success-bg)'],
  [/#bbf7d0\b/g, 'var(--success-border)'],
  [/#2563eb\b/g, 'var(--info)'],
  [/#eff6ff\b/g, 'var(--info-bg)'],
  [/#bfdbfe\b/g, 'var(--info-border)'],
  [/#93c5fd\b/g, 'var(--info-border-light)'],
  [/#1d4ed8\b/g, 'var(--info-text)'],
  [/#7c3aed\b/g, 'var(--purple)'],
  [/#f5f3ff\b/g, 'var(--purple-bg)'],
  [/#ddd6fe\b/g, 'var(--purple-border)'],
  [/#64748b\b/g, 'var(--icon-muted)'],
  [/#475569\b/g, 'var(--text-soft)'],
  [/#1e293b\b/g, 'var(--color-tooltip-bg)'],
  [/#ea580c\b/g, 'var(--a-to)'],
  [/#4f46e5\b/g, 'var(--accent)'],
  [/#dc2626\b/g, 'var(--danger)'],
  [/#fff1f2\b/g, 'var(--primary-bg)'],
  [/#fecdd3\b/g, 'var(--primary-border)'],
  [/#e11d48\b/g, 'var(--primary)'],
  [/#ffedd5\b/g, 'var(--ball-adjacent-ring)'],
  [/#dbeafe\b/g, 'var(--ball-source-ring)'],
  [/#059669\b/g, 'var(--color-status-hit)'],
  [/#ecfdf5\b/g, 'var(--color-status-hit-bg)'],
  [/#fff7ed\b/g, 'var(--color-status-skip-bg)'],
  [/#fffbeb\b/g, 'var(--color-surface-skip)'],
  [/#fff7e6\b/g, 'var(--warning-bg)'],
  [/#ffc53d\b/g, 'var(--warning-border)'],
  [/#d48806\b/g, 'var(--warning)'],
  [/#ca8a04\b/g, 'var(--warning-strong)'],
  [/#fef9c3\b/g, 'var(--warning-surface)'],
  [/#facc15\b/g, 'var(--warning-surface-border)'],
  [/#a16207\b/g, 'var(--warning-text)'],
  [/#081426\b/g, 'var(--color-black)'],
  [/#38bdf8\b/g, 'var(--color-login-accent)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.5\)/g, 'var(--color-overlay)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.45\)/g, 'var(--color-overlay-light)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.28\)/g, 'var(--color-overlay-subtle)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.22\)/g, 'var(--shadow-tooltip)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.2\)/g, 'var(--shadow-modal-sm)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.08\)/g, 'var(--shadow)'],
  [/rgba\(15,\s*23,\s*42,\s*0\.06\)/g, 'var(--shadow-card)'],
  [/border-radius:\s*4px/g, 'border-radius: var(--radius-xs)'],
  [/border-radius:\s*6px/g, 'border-radius: var(--radius-xs)'],
  [/border-radius:\s*8px/g, 'border-radius: var(--radius-sm)'],
  [/border-radius:\s*10px/g, 'border-radius: var(--radius-xl)'],
  [/border-radius:\s*999px/g, 'border-radius: var(--radius-pill)'],
  [/border-radius:\s*50%/g, 'border-radius: var(--radius-circle)'],
  [/font-size:\s*12px/g, 'font-size: var(--font-size-small)'],
  [/font-size:\s*11px/g, 'font-size: var(--font-size-hint)'],
  [/font-size:\s*10px/g, 'font-size: var(--font-size-tiny)'],
  [/font-size:\s*14px/g, 'font-size: var(--font-size-body)'],
  [/font-size:\s*20px/g, 'font-size: var(--font-size-title)'],
  [/#eef2f8\b/g, 'var(--chart-freeze-bg)'],
  [/#dbe3ef\b/g, 'var(--chart-freeze-border)'],
  [/#94a3b8\b/g, 'var(--chart-zone-border)'],
  [/#fff5f5\b/g, 'var(--chart-miss-bg)'],
  [/#fef2f2\b/g, 'var(--chart-miss-strong)'],
  [/#d97706\b/g, 'var(--chart-warn-text)'],
  [/#eef2f7\b/g, 'var(--chart-omission-0)'],
  [/#e4eaf1\b/g, 'var(--chart-omission-1)'],
  [/#d8e0ea\b/g, 'var(--chart-omission-2)'],
  [/#cad4e0\b/g, 'var(--chart-omission-3)'],
  [/#bcc7d6\b/g, 'var(--chart-omission-4)'],
  [/#5c6b80\b/g, 'var(--chart-omission-text-1)'],
  [/#536275\b/g, 'var(--chart-omission-text-2)'],
  [/#4a5869\b/g, 'var(--chart-omission-text-3)'],
  [/#3f4d5e\b/g, 'var(--chart-omission-text-4)'],
  [/#fed7aa\b/g, 'var(--chart-hit-warm-1)'],
  [/#fdba74\b/g, 'var(--chart-hit-warm-2)'],
  [/#fb923c\b/g, 'var(--chart-hit-warm-3)'],
  [/#fefce8\b/g, 'var(--chart-edge-bg)'],
  [/#ffe4e6\b/g, 'var(--chart-pink-bg)'],
  [/#f0f9ff\b/g, 'var(--chart-zone-a)'],
  [/#e0f2fe\b/g, 'var(--chart-zone-b)'],
  [/#bae6fd\b/g, 'var(--chart-zone-c)'],
  [/#fca5a5\b/g, 'var(--chart-mark-repeat)'],
  [/#ef4444\b/g, 'var(--chart-mark-repeat-ring)'],
  [/#eab308\b/g, 'var(--chart-mark-edge)'],
  [/#f87171\b/g, 'var(--chart-mark-consecutive)'],
  [/#fb7185\b/g, 'var(--chart-legend-pink-from)'],
  [/#fecaca\b/g, 'var(--chart-legend-bose-red)'],
  [/#0f172a\b/g, 'var(--color-dark-bg)'],
]

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory() && name !== 'node_modules') walk(p, files)
    else if (['.vue', '.css'].includes(extname(p))) files.push(p)
  }
  return files
}

const targets = walk(join(root, 'src')).filter(
  (f) => !f.includes('variables.css') && !f.includes('shared.css'),
)

let changed = 0
for (const file of targets) {
  let content = readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    writeFileSync(file, content)
    changed++
    console.log('updated:', file.replace(root + '\\', '').replace(root + '/', ''))
  }
}

console.log(`Done. ${changed} files updated.`)
