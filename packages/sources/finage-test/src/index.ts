import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import overrides from './config/overrides.json'
import { crypto, stock, eod, commodities, forex } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: stock.name,
  name: 'FINAGE',
  customSettings,
  overrides: overrides.finage,
  endpoints: [crypto, stock, eod, commodities, forex],
  bootstrap: async (adapter: Adapter<typeof customSettings>) => {
    if (adapter.config.WS_ENABLED && !adapter.config.WS_SOCKET_KEY) {
      throw 'WS_SOCKET_KEY is required when WS_ENABLED is set to true'
    }
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
