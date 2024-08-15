import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import type { BaseEndpointTypes } from '../endpoint/market-status'

export const markets = ['forex', 'metals'] as const

export type Market = (typeof markets)[number]

const marketToNcfxMarket: Record<Market, keyof WsMessage['marketStatus']> = {
  forex: 'fx',
  metals: 'metals',
}

type WsMessage = {
  marketStatus: {
    fx: string
    metals: string
  }
  timestamp: string
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxMarketStatusEndpoint')

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.MARKET_STATUS_WS_API_ENDPOINT,
  options: (context) => {
    return { headers: { 'x-api-key': context.adapterSettings.MARKET_STATUS_WS_API_KEY } }
  },
  handlers: {
    message(message: WsMessage): ProviderResult<WsTransportTypes>[] {
      if (!('marketStatus' in message) || typeof message.marketStatus !== 'object') {
        logger.warn('Invalid marketStatus field in response')
        return []
      }
      return markets.map((market) => {
        const marketStatus = parseMarketStatus(message.marketStatus[marketToNcfxMarket[market]])
        return {
          params: { market },
          response: {
            result: marketStatus,
            data: {
              result: marketStatus,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.timestamp).getTime(),
            },
          },
        }
      })
    },
  },
})

export function parseMarketStatus(marketStatus: string): MarketStatus {
  if (marketStatus === 'open') {
    return MarketStatus.OPEN
  }
  if (marketStatus === 'closed') {
    return MarketStatus.CLOSED
  }
  logger.warn(`Unexpected market status value: ${marketStatus}`)
  return MarketStatus.UNKNOWN
}
