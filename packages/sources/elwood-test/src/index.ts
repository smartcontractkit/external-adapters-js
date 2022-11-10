import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoints'
import { customSettings } from './config'

export const adapter = new PriceAdapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint: 'crypto',
  customSettings,
  endpoints: [cryptoEndpoint],
  envDefaultOverrides: {
    API_ENDPOINT: 'https://api.chk.elwood.systems/v1/stream',
    WS_API_ENDPOINT: 'wss://api.chk.elwood.systems/v1/stream',
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
