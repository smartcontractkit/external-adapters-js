import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter, PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { price } from './endpoint'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'

export const adapter = new PriceAdapter({
  name: 'DAR',
  endpoints: [price as PriceEndpoint<any>],
  defaultEndpoint: price.name,
  customSettings,
  envDefaultOverrides: {
    CACHE_MAX_AGE: 20 * 60 * 1000, //20 minutes
  },
})

export const server = (): Promise<ServerInstance | undefined> =>
  expose(adapter as unknown as Adapter<SettingsMap>)
