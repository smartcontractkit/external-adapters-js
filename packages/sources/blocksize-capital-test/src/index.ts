import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
//import { envDefaultOverrides } from './config/envDefaultOverrides'
import { price } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'BLOCKSIZECAPITAL',
  endpoints: [price],
  defaultEndpoint: price.name,
  customSettings,
  //envDefaultOverrides,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
