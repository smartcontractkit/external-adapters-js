import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { round } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: round.name,
  name: 'XUSD_USD_EXCHANGE_RATE',
  config,
  endpoints: [round],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
