export * from './http'
export * from './ws'

export const GROUP_COUNT = 1

export type AdapterNames = 'nomics' | 'cryptocompare' | 'tiingo'
interface AdapterConfig {
  name: AdapterNames
  /**
   * How many seconds to wait inbetween each call to this adapter
   */
  secondsPerCall: number
}
export const ADAPTERS: AdapterConfig[] = [
  { name: 'nomics', secondsPerCall: 10 },
  { name: 'cryptocompare', secondsPerCall: 1 },
  { name: 'tiingo', secondsPerCall: 5 },
]
