import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/forex'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('NcfxForexEndpoint')

export interface WsMessage {
  [pair: string]: { price: number; timestamp: string }
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.FOREX_WS_API_ENDPOINT,
  options: (context) => {
    return { headers: { 'x-api-key': context.adapterSettings.FOREX_WS_API_KEY } }
  },
  handlers: {
    message(message): ProviderResult<WsTransportTypes>[] {
      if (Object.keys(message).length === 0) {
        logger.debug('WS message is empty, skipping')
        return []
      }
      return Object.keys(message).map((pair) => {
        // Split forex pair with the assumption base and quote are always 3 characters long
        const base = pair.substring(0, 3)
        const quote = pair.substring(3)
        return {
          params: { base, quote },
          response: {
            result: message[pair].price,
            data: {
              result: message[pair].price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message[pair].timestamp).getTime(),
            },
          },
        }
      })
    },
  },
  builders: {
    subscribeMessage: (params) => ({
      request: 'subscribe',
      ccy: `${params.base}${params.quote}`,
    }),
    unsubscribeMessage: (params) => ({
      request: 'unsubscribe',
      ccy: `${params.base}${params.quote}`,
    }),
  },
})
