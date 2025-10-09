import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config, DEFAULT_ENDPOINT, NAME } from './config'
import { computedPrice, impliedPrice } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: DEFAULT_ENDPOINT,
  name: NAME,
  config,
  endpoints: [impliedPrice, computedPrice],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
