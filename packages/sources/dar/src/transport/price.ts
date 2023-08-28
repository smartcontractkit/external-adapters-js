import { getAuthToken } from './util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, RequestParams } from '../endpoint/price'

const logger = makeLogger('DarPriceEndpoint')

export interface ProviderMessage {
  darAssetID: string
  darAssetTicker: string
  quoteCurrency: string
  price: number
  publishedAt: string
  effectiveTime: number
  errors: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: ProviderMessage
  }
}

const pairHits: {
  [base: string]: {
    [quote: string]: number
  }
} = {}
let totalUniquePairs = 0
let totalHits = 0

const hitTrackingLevels: { [level: string]: boolean } = {
  debug: true,
  trace: true,
}

export const options = {
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => {
    const token = await getAuthToken(context.adapterSettings)
    return {
      headers: { Authorization: token, assets: '' },
    }
  },
  handlers: {
    message(message: any, context: EndpointContext<WsTransportTypes>) {
      if (message.errors) {
        logger.error(`Got error from DP: ${message.errors}`)
        return []
      }

      if (hitTrackingLevels[context.adapterSettings.LOG_LEVEL]) {
        const { darAssetTicker: base, quoteCurrency: quote } = message

        pairHits[base] ??= {}

        if (!pairHits[base][quote]) {
          pairHits[base][quote] = 1
          totalUniquePairs += 1
        } else {
          pairHits[base][quote] += 1
        }
        totalHits += 1
        logger.debug({ totalHits, totalUniquePairs, pairHits: pairHits[base][quote], base, quote })
      }

      return [
        {
          params: { base: message.darAssetTicker, quote: message.quoteCurrency },
          response: {
            result: message.price,
            data: {
              result: message.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.effectiveTime * 1000,
            },
          },
        },
      ]
    },
  },
}

export class DarWebsocketTransport extends WebSocketTransport<WsTransportTypes> {
  override async streamHandler(
    context: EndpointContext<WsTransportTypes>,
    subscriptions: SubscriptionDeltas<RequestParams>,
  ): Promise<void> {
    let subscribeAssets = ''
    for (const pair of subscriptions.desired) {
      subscribeAssets = subscribeAssets.concat(`${pair['base'].toString().toLowerCase()},`)
    }

    if (this.wsConnection && !this.connectionClosed() && subscriptions.new.length) {
      logger.debug(
        `closing WS connection for new subscriptions: ${JSON.stringify(subscriptions.desired)}`,
      )
      const closed = new Promise<void>((resolve) => (this.wsConnection.onclose = resolve))
      this.wsConnection.close()
      await closed
    }

    subscriptions.new = subscriptions.desired

    options.options = async (context: EndpointContext<WsTransportTypes>) => {
      const token = await getAuthToken(context.adapterSettings)
      return {
        headers: { Authorization: token, assets: subscribeAssets },
      }
    }

    await super.streamHandler(context, subscriptions)
  }
}

export const transport = new DarWebsocketTransport(options)
