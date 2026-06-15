/**
 * 复合列走势表工具 — 从分段配置生成表头分组与分隔线
 */

/**
 * @param {{ label: string, colspan: number, separatorBefore?: boolean }[]} groups
 * @returns {number[]} 1-based 列号，粗分组线位置
 */
export function groupStartsFromHeaderGroups(groups) {
  let col = 1
  const separators = []
  for (let i = 0; i < groups.length; i += 1) {
    if (i > 0 && groups[i].separatorBefore !== false) separators.push(col)
    col += groups[i].colspan
  }
  return separators
}

/**
 * 从分段配置展平列头
 * @param {{ headers: string[] }[]} segments
 */
export function flattenSegmentHeaders(segments) {
  return segments.flatMap((seg) => seg.headers)
}

/**
 * 从分段配置生成 headerGroups（第一行合并表头）
 * @param {{ label: string, headers: string[], separatorBefore?: boolean }[]} segments
 */
export function headerGroupsFromSegments(segments) {
  return segments.map((seg) => ({
    label: seg.label,
    colspan: seg.headers.length,
    separatorBefore: seg.separatorBefore,
  }))
}
