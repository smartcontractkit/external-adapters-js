import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import overrides from './config/overrides.json'
import { crypto, stock, eod, commodities, forex } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: stock.name,
  name: 'FINAGE',
  customSettings,
  overrides: overrides.finage,
  endpoints: [crypto, stock, eod, commodities, forex],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
