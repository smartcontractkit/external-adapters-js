import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

interface WsMessage {
  [pair: string]: { price: number; timestamp: string }
}

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxForexEndpoint')

export const forexTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => context.adapterSettings.FOREX_WS_API_ENDPOINT,
  options: (context) => {
    const forexEncodedCreds =
      context.adapterSettings.FOREX_WS_USERNAME && context.adapterSettings.FOREX_WS_PASSWORD
        ? Buffer.from(
            JSON.stringify({
              grant_type: 'password',
              username: context.adapterSettings.FOREX_WS_USERNAME,
              password: context.adapterSettings.FOREX_WS_PASSWORD,
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

export function customInputValidation(
  _: AdapterRequest<typeof inputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (!settings.FOREX_WS_USERNAME || !settings.FOREX_WS_PASSWORD) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'Forex endpoint credentials are not set',
    })
  }
  return
}

export const forexEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'forex',
  transport: forexTransport,
  inputParameters,
  customInputValidation,
})
