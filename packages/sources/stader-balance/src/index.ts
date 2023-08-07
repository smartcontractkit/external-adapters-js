import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balanceEndpoint } from './endpoint/balance'
import { totalSupplyEndpoint } from './endpoint/totalSupply'

export const adapter = new Adapter({
  name: 'STADER_BALANCE',
  endpoints: [balanceEndpoint, totalSupplyEndpoint],
  defaultEndpoint: balanceEndpoint.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
