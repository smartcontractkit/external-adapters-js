import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { roundEndpoint } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: roundEndpoint.name,
  name: 'XUSD_USD_EXCHANGE_RATE',
  config,
  endpoints: [roundEndpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
