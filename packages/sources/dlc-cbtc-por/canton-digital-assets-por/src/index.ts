import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { supply } from './endpoint'

export const adapter = new Adapter({
  name: 'DLC_CBTC_CANTON_DIGITAL_ASSETS_POR',
  defaultEndpoint: supply.name,
  config,
  endpoints: [supply],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
