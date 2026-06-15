import { sortRecordsByIssue } from '../sortRecords.js'
import {
  calcSum,
  tail,
  getTrend,
  isTailBig,
  isSumTailEven,
  isSumTailPrime,
  sumTailRoad,
} from './metrics.js'
import { getWuxingBySum } from './groups.js'
import { buildTrendChart } from './trendBase.js'

const TAIL_HEADERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export const HZW_COL = {
  TAIL: 1,
  DX: 11,
  JO: 13,
  ZH: 15,
  ROAD: 17,
  SPJ: 20,
  ZF: 23,
  WX: 33,
}

export const HZW_HEADER_GROUPS = [
  { label: '和值', colspan: 10 },
  { label: '大小', colspan: 2, separatorBefore: false },
  { label: '奇偶', colspan: 2, separatorBefore: false },
  { label: '质合', colspan: 2 },
  { label: '012路', colspan: 3 },
  { label: '升平降', colspan: 3 },
  { label: '振幅', colspan: 10 },
  { label: '五行', colspan: 5 },
]

const HZW_HEADERS = [
  ...TAIL_HEADERS,
  '小',
  '大',
  '偶',
  '奇',
  '合',
  '质',
  '0路',
  '1路',
  '2路',
  '升',
  '平',
  '降',
  ...TAIL_HEADERS,
  '金',
  '木',
  '水',
  '火',
  '土',
]

function trendOptions(options = {}) {
  return options.rowOrder ? { rowOrder: options.rowOrder } : {}
}

export function buildSumTailChart(records, options = {}) {
  const chronological = [...sortRecordsByIssue(records, 'desc')].reverse()
  const spjMap = new Map()
  const ampMap = new Map()
  let prevTail = null

  for (const record of chronological) {
    const sumTail = tail(calcSum(record.numbers))
    const spjCol = prevTail === null ? 1 : getTrend(prevTail, sumTail) + 1
    const amp = prevTail === null ? 0 : Math.abs(sumTail - prevTail)
    spjMap.set(record.issue, spjCol)
    ampMap.set(record.issue, amp)
    prevTail = sumTail
  }

  const chart = buildTrendChart(records, {
    ...trendOptions(options),
    columnCount: HZW_HEADERS.length,
    headers: HZW_HEADERS,
    getActiveCols: (record) => {
      const sum = calcSum(record.numbers)
      const sumTail = tail(sum)
      return [
        sumTail + 1,
        HZW_COL.DX + (isTailBig(sumTail) ? 1 : 0),
        HZW_COL.JO + (isSumTailEven(sumTail) ? 0 : 1),
        HZW_COL.ZH + (isSumTailPrime(sumTail) ? 1 : 0),
        HZW_COL.ROAD + sumTailRoad(sumTail),
        HZW_COL.SPJ + spjMap.get(record.issue) - 1,
        HZW_COL.ZF + ampMap.get(record.issue),
        HZW_COL.WX + getWuxingBySum(sum),
      ]
    },
    formatHit: (col) => {
      if (col >= HZW_COL.ROAD && col < HZW_COL.SPJ) {
        return String(col - HZW_COL.ROAD)
      }
      if (col >= HZW_COL.ZF && col < HZW_COL.WX) {
        return String(col - HZW_COL.ZF)
      }
      return HZW_HEADERS[col - 1]
    },
    zoneEvery: 5,
  })

  return {
    ...chart,
    headerGroups: HZW_HEADER_GROUPS,
    predictionColumns: 10,
    zoneEveryMaxCol: 14,
    zoneBoundaries: [6, 11, 13, 15, 17, 20, 23, 33],
  }
}
