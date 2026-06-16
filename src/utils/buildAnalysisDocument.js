import { analyzeNumbers } from './numberPicker.js'
import { buildReportSnapshot } from './reportMetrics.js'
import { loadNumberRecords, buildNumberRecordStats } from './numberRecordStorage.js'
import { formatBall, formatBalls } from './format.js'

function formatNow() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function ballsLine(nums) {
  if (!nums?.length) return '—'
  return formatBalls(nums)
}

function joinNums(items, key = 'num') {
  if (!items?.length) return '—'
  return items.map((item) => formatBall(typeof item === 'number' ? item : item[key])).join(' ')
}

function trendTail(trend, count = 5) {
  if (!trend?.length) return '—'
  return trend
    .slice(-count)
    .map((item) => `${item.issue}:${item.value}`)
    .join('  ')
}

/**
 * 根据开奖数据生成可复制分析报告
 * @param {Array} records 按期号倒序
 * @param {{ issue?: string, lookback?: number }} options
 */
export function buildAnalysisDocument(records, { issue = '', lookback = 9 } = {}) {
  if (!records?.length) {
    return {
      meta: { error: '暂无开奖数据' },
      sections: [],
      plainText: '暂无开奖数据，请先返回首页加载开奖记录。',
    }
  }

  let analysis
  try {
    analysis = analyzeNumbers(records, lookback, issue || records[0].issue)
  } catch (err) {
    return {
      meta: { error: err.message },
      sections: [],
      plainText: err.message || '分析失败',
    }
  }

  const report = buildReportSnapshot(records)
  const { current } = analysis
  const overview = report?.overview
  const numberRecords = loadNumberRecords()
  const recordStats = buildNumberRecordStats(numberRecords)
  const recentRecords = numberRecords.slice(0, 8)

  const meta = {
    generatedAt: formatNow(),
    totalIssues: records.length,
    latestIssue: records[0].issue,
    baseIssue: current.issue,
    baseDate: current.date,
    lookback: analysis.lookback,
    dataError: null,
  }

  const sections = [
    {
      id: 'header',
      title: '报告摘要',
      lines: [
        `快乐8 分析报告`,
        `生成时间：${meta.generatedAt}`,
        `数据范围：共 ${meta.totalIssues} 期，最新 ${meta.latestIssue} 期`,
        `分析基准：第 ${meta.baseIssue} 期（${meta.baseDate}）· 回溯 ${meta.lookback} 期`,
      ],
    },
    {
      id: 'draw',
      title: '基准期开奖',
      lines: [
        `期号：${current.issue}`,
        `日期：${current.date || '—'}`,
        `开奖号码：${ballsLine(current.numbers)}`,
        overview
          ? `和值 ${overview.latestSum} · 奇偶 ${overview.latestOdd}:${20 - overview.latestOdd} · 大小 ${overview.latestSmall}:${20 - overview.latestSmall}`
          : null,
        overview
          ? `重号 ${overview.latestRepeat} 个${overview.latestRepeatNumbers?.length ? `（${joinNums(overview.latestRepeatNumbers)}）` : ''} · 连号 ${overview.latestConsecutive} 组`
          : null,
      ].filter(Boolean),
    },
    {
      id: 'pick',
      title: '选号分析',
      lines: [
        `规则：邻号反选 · 回溯 ${analysis.lookback} 期`,
        `A 类（重复入选，${analysis.classA.length} 个）：${joinNums(analysis.classA)}`,
        `B 类（单次入选，${analysis.classB.length} 个）：${joinNums(analysis.classB)}`,
        `B 类冷号（${analysis.classBCold.length} 个）：${joinNums(analysis.classBCold)}`,
        `候选合计：${analysis.totalPicks} 个号码`,
      ],
    },
    {
      id: 'market',
      title: '数据统计',
      lines: [
        `遗漏 TOP5：${report?.omissionRank?.slice(0, 5).map((item) => `${formatBall(item.num)}(${item.currentOmission}期)`).join(' ') || '—'}`,
        `热号（近30期≥8次）：${joinNums(report?.hot?.slice(0, 10) || [])}`,
        `冷号（遗漏≥8期）：${joinNums(report?.cold?.slice(0, 10) || [])}`,
        `深冷号（遗漏≥20期，${report?.deepColdNumbers?.length || 0} 个）：${joinNums(report?.deepColdNumbers?.slice(0, 12) || [])}`,
        report?.zoneAvg
          ? `四区出号：${report.zoneAvg.map((z) => `${z.label}${z.latest}个/均${z.avg}`).join(' · ')}`
          : null,
        report?.sumZones
          ? `和值区间（近${overview?.sampleWindow || 100}期）：${report.sumZones.map((z) => `${z.label}${z.count}期`).join(' · ')}`
          : null,
      ].filter(Boolean),
    },
    {
      id: 'trend',
      title: '近5期走势',
      lines: [
        `重号个数：${trendTail(report?.repeatTrend)}`,
        `连号组数：${trendTail(report?.consecutiveTrend)}`,
        `和值：${trendTail(report?.sumTrend)}`,
        report?.oddTrend?.length
          ? `奇偶(奇:偶)：${report.oddTrend.slice(-5).map((item) => `${item.issue}:${item.odd}:${item.even}`).join('  ')}`
          : null,
      ].filter(Boolean),
    },
    {
      id: 'records',
      title: '本地投入记录',
      lines: numberRecords.length
        ? [
            `共 ${recordStats.totalIssues} 期 · 总投入 ${recordStats.totalSpent.toFixed(2)} 元 · 总盈亏 ${recordStats.totalProfit.toFixed(2)} 元 · 盈利 ${recordStats.winCount} 期 / 亏损 ${recordStats.loseCount} 期`,
            ...recentRecords.map(
              (item) =>
                `${item.issue} 期 · 投入 ${Number(item.spent) || 0} 元 · ${Number(item.numberCount) || 0} 注 · 盈亏 ${Number(item.profit) || 0} 元${item.note ? ` · ${item.note}` : ''}`,
            ),
            numberRecords.length > recentRecords.length
              ? `… 另有 ${numberRecords.length - recentRecords.length} 条记录未列出`
              : null,
          ].filter(Boolean)
        : ['暂无本地投入记录（可在页头「号码记录」中添加）'],
    },
    {
      id: 'footer',
      title: '备注',
      lines: [
        '本报告由快乐8选号分析自动生成，仅供研究参考。',
        '开奖数据请以中国福彩官方公告为准，历史规律不代表未来结果。',
      ],
    },
  ]

  const plainText = sections
    .map((section) => [`【${section.title}】`, ...section.lines, ''].join('\n'))
    .join('\n')
    .trim()

  return { meta, sections, plainText, analysis, report }
}

export function buildSectionPlainText(section) {
  return [`【${section.title}】`, ...section.lines].join('\n')
}
