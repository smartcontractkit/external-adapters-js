import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { customSettings, FOREX_DEFAULT_BASE_WS_URL } from '../config'

interface WsMessage {
  [pair: string]: { price: number; timestamp: string }
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxForexEndpoint')

export const forexTransport = new WebSocketTransport<EndpointTypes>({
  url: () => FOREX_DEFAULT_BASE_WS_URL,
  options: (context) => {
    const forexEncodedCreds =
      context.adapterConfig.FOREX_WS_USERNAME && context.adapterConfig.FOREX_WS_PASSWORD
        ? Buffer.from(
            JSON.stringify({
              grant_type: 'password',
              username: context.adapterConfig.FOREX_WS_USERNAME,
              password: context.adapterConfig.FOREX_WS_PASSWORD,
            }),
          ).toString('base64')
        : ''
    return { headers: { ncfxauth: forexEncodedCreds } }
  },
  handlers: {
    message(message): ProviderResult<EndpointTypes>[] {
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
              providerIndicatedTime: new Date(message[pair].timestamp).getTime(),
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

export const forexEndpoint = new PriceEndpoint({
  name: 'forex',
  transport: forexTransport,
  inputParameters: priceEndpointInputParameters,
})
