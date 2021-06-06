export * from './http'
export * from './ws'

export const GROUP_COUNT = 1

interface AdapterConfig {
  name: string
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
