import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { globalMarketCap, dominance, historical, crypto } from './endpoint'
import { customSettings } from './config'

export const adapter = new Adapter({
  defaultEndpoint: crypto.name,
  name: 'COINMARKETCAP',
  customSettings,
  envDefaultOverrides: {
    API_ENDPOINT: 'https://pro-api.coinmarketcap.com/v1/',
  },
  endpoints: [globalMarketCap, dominance, historical, crypto],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
