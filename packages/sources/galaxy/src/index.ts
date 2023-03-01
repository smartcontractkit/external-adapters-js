import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { CryptoPriceEndpoint, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { price } from './endpoint'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'

export const adapter = new PriceAdapter({
  name: 'GALAXY',
  endpoints: [price as CryptoPriceEndpoint<any>],
  defaultEndpoint: price.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> =>
  expose(adapter as unknown as Adapter<SettingsMap>)
