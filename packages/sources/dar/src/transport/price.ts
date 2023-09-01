import { getAuthToken } from './util'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
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

export const config: WebSocketTransportConfig<WsTransportTypes> = {
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context, desiredSubs) => {
    const token = await getAuthToken(context.adapterSettings)

    const subscribeAssets: string[] = []
    for (const pair in desiredSubs) {
      subscribeAssets.push(desiredSubs[pair]['base'].toLowerCase())
    }
    const subscribe_assets = subscribeAssets.join(',')

    return {
      headers: { Authorization: token, assets: subscribe_assets },
    }
  },
  handlers: {
    message(message: ProviderMessage, context: EndpointContext<WsTransportTypes>) {
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
    if (
      this.wsConnection &&
      !this.connectionClosed() &&
      (subscriptions.new.length || subscriptions.stale.length)
    ) {
      logger.debug(
        `closing WS connection for new subscriptions: ${JSON.stringify(subscriptions.desired)}`,
      )
      const closed = new Promise<void>((resolve) => (this.wsConnection.onclose = resolve))
      this.wsConnection.close()
      await closed
    }

    subscriptions.new = subscriptions.desired
    await super.streamHandler(context, subscriptions)
  }
}

export const transport = new DarWebsocketTransport(config)
