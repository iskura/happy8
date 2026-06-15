import { buildChart } from './charts/index.js'

/** @deprecated 使用 buildChart('hmfb', records) */
export function buildDistribution(records) {
  return buildChart('hmfb', records)
}

export { getOmissionLevel, getOmissionLayer } from './charts/index.js'
