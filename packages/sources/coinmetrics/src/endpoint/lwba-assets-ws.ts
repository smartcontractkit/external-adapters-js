import {
  AdapterEndpoint,
  EndpointContext,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { handleCryptoLwbaMessage } from './lwba-ws'
import type { WsPairQuoteMessage, WsCryptoLwbaEndpointTypes } from './lwba-ws'

const logger = makeLogger('CoinMetrics Crypto LWBA ASSETS WS')

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export const calculateAssetQuotesUrl = (
  context: EndpointContext<WsCryptoLwbaEndpointTypes>,
  desiredSubs: (typeof inputParameters.validated)[],
): string => {
  const { API_KEY, WS_API_ENDPOINT } = context.adapterSettings
  const assets = [...new Set(desiredSubs.map((pair) => pair.base.toLowerCase()))].sort().join(',')
  const generated = new URL('/v4/timeseries-stream/asset-quotes', WS_API_ENDPOINT)
  generated.searchParams.append('assets', assets)
  generated.searchParams.append('api_key', API_KEY)
  logger.debug(`Generated URL: ${generated.toString()}`)
  return generated.toString()
}

export const wsTransport = new WebSocketTransport<WsCryptoLwbaEndpointTypes>({
  url: (context, desiredSubs) => {
    return calculateAssetQuotesUrl(context, desiredSubs)
  },
  handlers: {
    message(message: WsPairQuoteMessage): ProviderResult<WsCryptoLwbaEndpointTypes>[] | undefined {
      return handleCryptoLwbaMessage(message)
    },
  },
})

export const endpoint = new AdapterEndpoint<WsCryptoLwbaEndpointTypes>({
  name: 'crypto-lwba-assets',
  aliases: ['crypto_lwba_assets'],
  transport: wsTransport,
  inputParameters,
})
