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
    return {
      headers: {
        Authorization: token,
        assets: [...new Set(desiredSubs.map((pair) => pair['base'].toLowerCase()))].join(','),
      },
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
    const desiredBases = subscriptions.desired.map((s) => s.base)
    const shouldUnsubscribe = () => {
      // we unsubscribe and resubscribe if a new subscription (base) is present in desired subscriptions only once or
      // when stale subscription (base) is not part of desired subscriptions
      return (
        subscriptions.new.some((s) => desiredBases.filter((a) => a === s.base).length === 1) ||
        subscriptions.stale.some((s) => desiredBases.indexOf(s.base) === -1)
      )
    }

    if (this.wsConnection && !this.connectionClosed() && shouldUnsubscribe()) {
      logger.debug(
        `closing WS connection for new subscriptions: ${JSON.stringify(subscriptions.desired)}`,
      )
      const closed = new Promise<void>((resolve) => (this.wsConnection.onclose = resolve))
      this.wsConnection.close()
      await closed
    }

    subscriptions.new = subscriptions.desired
    subscriptions.stale = []
    await super.streamHandler(context, subscriptions)
  }
}

export const transport = new DarWebsocketTransport(config)
