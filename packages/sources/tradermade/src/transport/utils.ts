import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from './../config'
import { inputParameters } from '../endpoint/live'
import { inputParameters as forexInputParams } from '../endpoint/forex'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WsTransportTypes } from './forex-ws'

export interface ResponseSchema {
  endpoint: string
  quotes: {
    ask: number
    base_currency: string
    bid: number
    mid: number
    quote_currency: string
    error?: number
    instrument?: string
    message?: string
  }[]
  requested_time: string
  timestamp: number
}

export type ForexRequestParams = typeof forexInputParams.validated

const logger = makeLogger('PriceUtils')
export const buildIndividualRequests = <T extends typeof inputParameters.validated>(
  params: T[],
  settings: typeof config.settings,
) => {
  return params.map((param) => ({
    params: [param],
    request: {
      baseURL: settings.API_ENDPOINT,
      params: {
        currency: `${param.base}${param.quote ?? ''}`.toUpperCase(),
        api_key: settings.API_KEY,
      },
    },
  }))
}

export const constructEntry = <T extends typeof inputParameters.validated>(
  res: ResponseSchema,
  params: T[],
) => {
  return params.map((param) => {
    const entry = res.quotes[0]
    if (!entry) {
      const errorMessage = `Tradermade provided no data for ${param.base}/${param.quote}`
      logger.info(errorMessage)
      return {
        params: param,
        response: {
          errorMessage,
          statusCode: 502,
        },
      }
    } else if (entry.error) {
      const errorMessage = `Tradermade returned error ${entry.error} for ${param.base}/${param.quote}`
      logger.info(errorMessage)
      return {
        params: param,
        response: {
          errorMessage,
          statusCode: 502,
        },
      }
    } else {
      return {
        params: param,
        response: {
          data: {
            result: entry.mid,
          },
          result: entry.mid,
        },
      }
    }
  })
}

export class TraderMadeWebsocketReverseMappingTransport extends WebsocketReverseMappingTransport<
  WsTransportTypes,
  string
> {
  apiKey = ''

  override async streamHandler(
    context: EndpointContext<WsTransportTypes>,
    subscriptions: SubscriptionDeltas<ForexRequestParams>,
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
    subscriptions.stale = []
    await super.streamHandler(context, subscriptions)
  }

  override async sendMessages(
    _context: EndpointContext<WsTransportTypes>,
    subscribes: ForexRequestParams[],
    unsubscribes: unknown[],
  ): Promise<void> {
    // Send a single message containing the entire set of subscribed symbols rather than
    // one message per symbol.

    if (unsubscribes.length) {
      // We explicitly set subscriptions.stale to empty.
      logger.warn(`unexpected unsubscribes: ${JSON.stringify(unsubscribes)}`)
    }

    if (!subscribes.length) {
      // No symbols to subscribe to
      logger.debug(`nothing to subscribe to, skipping initial message`)
      return
    }

    const payload = {
      userKey: this.apiKey,
      symbol: subscribes
        .map((params) => {
          const asset = `${params.base}${params.quote}`.toUpperCase()
          this.setReverseMapping(asset, params)
          return asset
        })
        .sort()
        .join(','),
    }

    this.wsConnection.send(this.serializeMessage(payload))
  }
}
