import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { attesterSupply, daSupply } from './endpoint'

export const adapter = new Adapter({
  name: 'DLC_CBTC_CANTON_POR',
  defaultEndpoint: attesterSupply.name,
  config,
  endpoints: [attesterSupply, daSupply],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
