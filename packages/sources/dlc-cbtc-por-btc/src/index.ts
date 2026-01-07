import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserves } from './endpoint'

export const adapter = new Adapter({
  name: 'DLC_CBTC_BTC_POR',
  defaultEndpoint: reserves.name,
  config,
  endpoints: [reserves],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
