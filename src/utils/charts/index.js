export { buildChart } from './builders.js'
export { getOmissionLevel, getOmissionLayer } from './trendBase.js'
export {
  CHART_REGISTRY,
  CHART_TYPES,
  getChartRegistryEntry,
  resolveChartUi,
} from '../../config/chartRegistry.js'

/** @deprecated 请使用 CHART_REGISTRY */
export { CHART_META, CHART_INDICATOR_HELP } from './builders.js'
