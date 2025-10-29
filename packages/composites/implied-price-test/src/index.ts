import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { computedPrice } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: computedPrice.name,
  name: 'IMPLIED_PRICE_TEST',
  config,
  endpoints: [computedPrice],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
