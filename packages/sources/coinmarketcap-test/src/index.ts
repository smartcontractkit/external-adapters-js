import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { globalMarketCap, dominance, historical } from './endpoint'
// import { customSettings } from './config'

export const adapter = new Adapter({
  defaultEndpoint: 'globalMarketcap',
  name: 'COINMARKETCAP',
  // customSettings,
  endpoints: [globalMarketCap, dominance, historical],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
