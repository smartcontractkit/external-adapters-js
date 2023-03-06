import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import {
  CryptoPriceEndpoint,
  PriceAdapter,
  PriceEndpoint,
} from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, stock, eod, commodities, forex } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: stock.name,
  name: 'FINAGE',
  customSettings,
  endpoints: [
    crypto as CryptoPriceEndpoint<any>,
    stock,
    eod,
    commodities as PriceEndpoint<any>,
    forex as PriceEndpoint<any>,
  ],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
