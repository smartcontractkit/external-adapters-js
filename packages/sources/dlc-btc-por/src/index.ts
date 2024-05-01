import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { proofOfReserves } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: proofOfReserves.name,
  name: 'DLC_BTC_POR',
  config,
  endpoints: [proofOfReserves],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
