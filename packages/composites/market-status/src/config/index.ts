import { AdapterRequest, AdapterResponse, Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'

export const NAME = 'MARKET_STATUS'

export const markets = ['forex', 'metals'] as const

export type Market = (typeof markets)[number]

export const adapterNames = ['ncfx', 'tradinghours'] as const

export type AdapterName = (typeof adapterNames)[number]

export type GetMarketStatusAdapter = (name: AdapterName) => CallMarketStatusAdapter

export type CallMarketStatusAdapter = (input: AdapterRequest) => Promise<MarketStatus>

export type Config = {
  getMarketStatusAdapter: GetMarketStatusAdapter
}

export const makeConfig = (prefix = ''): Config => {
  const getMarketStatusAdapter: GetMarketStatusAdapter = (name: AdapterName) => {
    const adapterUrl = util.getRequiredEnv('ADAPTER_URL', name.toUpperCase())
    const defaultConfig = Requester.getDefaultConfig(prefix)
    defaultConfig.api.baseURL = adapterUrl
    defaultConfig.api.method = 'POST'

    return async (input: AdapterRequest) => {
      try {
        const resp = await Requester.request<AdapterResponse>({
          ...defaultConfig.api,
          data: input,
        })
        return resp.data.result as MarketStatus
      } catch (err) {
        Logger.warn(`failed to call adapter ${name}: ${err}`)
      }
      return MarketStatus.UNKNOWN
    }
  }

  return { getMarketStatusAdapter }
}
