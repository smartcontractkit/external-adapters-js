import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { cryptoEndpoint, forexEndpoint } from './endpoint'
import includes from './config/includes.json'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'

export const adapter = new PriceAdapter({
  name: 'ncfx',
  endpoints: [cryptoEndpoint, forexEndpoint],
  defaultEndpoint: cryptoEndpoint.name,
  customSettings,
  includes,
})

export const server = (): Promise<ServerInstance | undefined> =>
  expose(adapter as unknown as Adapter<SettingsMap>)
