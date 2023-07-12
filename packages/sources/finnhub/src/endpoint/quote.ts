import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/quote-http'
import { wsTransport } from '../transport/quote-ws'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

// Forex symbols delimit the exchange from the pair by ":", and the two pair items by "_" or "-". E.g. "FHFX:EUR-USD" or "OANDA:EUR_USD"
const FOREX_SYMBOL_REGEX = new RegExp(`[:_-]+`)

// Transform Forex symbols into separate exchange, base and quote params.
export const requestTransform = (req: AdapterRequest<typeof inputParameters.validated>): void => {
  const requestBase = req.requestContext.data.base.toUpperCase()

  if (FOREX_SYMBOL_REGEX.test(requestBase)) {
    req.requestContext.data.base = requestBase

    // Discard quote, as base contains the full symbol
    req.requestContext.data.quote = undefined
  }
}

export const buildQuoteEndpoint = (overrides?: Record<string, string>) =>
  new PriceEndpoint<BaseEndpointTypes>({
    name: 'quote',
    aliases: ['common', 'stock', 'forex'],
    transportRoutes: new TransportRoutes<BaseEndpointTypes>()
      .register('ws', wsTransport)
      .register('rest', httpTransport),
    defaultTransport: 'rest',
    customRouter: (_req, adapterConfig) => (adapterConfig.WS_ENABLED ? 'ws' : 'rest'),
    inputParameters: inputParameters,
    overrides,
    requestTransforms: [requestTransform],
  })

export const endpoint = buildQuoteEndpoint(overrides.finnhub)
