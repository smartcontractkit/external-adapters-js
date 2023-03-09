import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { commodities, crypto, eod, forex, stock } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: stock.name,
  name: 'FINAGE',
  config,
  endpoints: [crypto, stock, eod, commodities, forex],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
