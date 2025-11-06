import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseCryptoEndpointTypes } from '../endpoint/price'
import { wsMessageContent } from './utils'

const logger = makeLogger('TiingoStateWSTransport')
const URL_SELECTION_CYCLE_LENGTH = 6

interface Message {
  service: string
  messageType: string
  data: [string, string, string, string, number]
}

const tickerIndex = 1
const dateIndex = 2
const priceIndex = 4

type WsTransportTypes = BaseCryptoEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

class TiingoStateWSTransport extends WebSocketTransport<WsTransportTypes> {
  // business logic connection attempts (repeats):
  //   5x try connecting to primary url
  //   1x try connection to secondary url
  override async determineUrlChange(
    context: EndpointContext<WsTransportTypes>,
  ): Promise<{ urlChanged: boolean; url: string }> {
    const primaryUrl = `${context.adapterSettings.WS_API_ENDPOINT}/crypto-synth-state`
    const secondaryUrl = `${context.adapterSettings.SECONDARY_WS_API_ENDPOINT}/crypto-synth-state`

    const zeroIndexedNumAttemptedConnections = this.streamHandlerInvocationsWithNoConnection - 1
    const cycle = zeroIndexedNumAttemptedConnections % URL_SELECTION_CYCLE_LENGTH
    const url = cycle !== URL_SELECTION_CYCLE_LENGTH - 1 ? primaryUrl : secondaryUrl
    const urlChanged = this.currentUrl !== url

    logger.trace(
      `determineUrlChange: connection attempts ${zeroIndexedNumAttemptedConnections}, url: ${url}`,
    )
    return { urlChanged, url }
  }
}

export const wsTransport = new TiingoStateWSTransport({
  url: (context) => {
    return `${context.adapterSettings.WS_API_ENDPOINT}/crypto-synth-state`
  },
  handlers: {
    message(message) {
      if (!message?.data?.length || message.messageType !== 'A' || !message.data[priceIndex]) {
        return []
      }
      const [base, quote] = message.data[tickerIndex].split('/')
      return [
        {
          params: { base, quote },
          response: {
            data: {
              result: message.data[priceIndex],
            },
            result: message.data[priceIndex],
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.data[dateIndex]).getTime(),
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params, context) => {
      return wsMessageContent(
        'subscribe',
        context.adapterSettings.API_KEY,
        8,
        params.base,
        params.quote,
      )
    },
    unsubscribeMessage: (params, context) => {
      return wsMessageContent(
        'unsubscribe',
        context.adapterSettings.API_KEY,
        8,
        params.base,
        params.quote,
      )
    },
  },
})
