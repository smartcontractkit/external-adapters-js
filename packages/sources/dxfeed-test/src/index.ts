import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { price } from './endpoint'
import { customSettings } from './config'
import overrides from './config/overrides.json'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'DXFEED',
  overrides: overrides.dxfeed,
  customSettings,
  endpoints: [price],
  bootstrap: async (adapter: Adapter<typeof customSettings>) => {
    if (adapter.config.WS_ENABLED && !adapter.config.WS_API_ENDPOINT) {
      return Promise.reject('WS_API_ENDPOINT is required when WS_ENABLED is set to true')
    }
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
