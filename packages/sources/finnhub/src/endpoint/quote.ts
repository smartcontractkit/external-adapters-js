import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, exchanges } from '../config'
import { httpTransport } from '../transport/quote-http'
import { wsTransport } from '../transport/quote-ws'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Finnhub Quote')

export const inputParameters = new InputParameters(
  {
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
      required: false,
    },
    exchange: {
      type: 'string',
      description: 'The exchange to fetch data for',
      required: false,
    },
    endpointName: {
      type: 'string',
      description:
        'Is set automatically based on request endpoint alias/name. Providing a custom value has no effect',
      required: false,
    },
  },
  [
    {
      base: 'EUR',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

// Finnhub separates the Exchange from the Pair by ":"
const exchangeDelimiter = ':'

// Finnhub separates the Pair symbols by a different character depending on exchange. E.g. "FHFX:EUR-USD" or "OANDA:EUR_USD"
const exchangePairRegex = new RegExp(
  `[${Object.values(exchanges)
    .map((e) => e.pairDelimiter)
    .join('')}]`,
)

// Checks whether the symbol is a full symbol, containing an Exchange and a Pair.
const isExchangeSymbol = (symbol: string) =>
  symbol.includes(exchangeDelimiter) && exchangePairRegex.test(symbol)

// If the symbol is a full symbol (containing Exchange and Pair), split into the separate params
export const splitSymbol = (symbol: string): typeof inputParameters.validated => {
  if (isExchangeSymbol(symbol)) {
    const [exchange, pair] = symbol.split(exchangeDelimiter)
    const [base, quote] = pair.split(exchangePairRegex)

    return { base, quote, exchange }
  }

  return {
    base: symbol,
  }
}

export const buildSymbol = ({
  base,
  quote,
  exchange,
}: typeof inputParameters.validated): string => {
  if (isExchangeSymbol(base)) {
    return base
  }

  if (base && quote && exchange) {
    const exchangePairDelimiter: string = exchanges[exchange].pairDelimiter

    return `${exchange}${exchangeDelimiter}${base}${exchangePairDelimiter}${quote}`
  }

  return base
}

const requestTransform = (req: AdapterRequest<typeof inputParameters.validated>) => {
  req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
  req.requestContext.data.quote = req.requestContext.data.quote?.toUpperCase()
  req.requestContext.data.exchange = req.requestContext.data.exchange?.toUpperCase()

  const originalRequest = { ...req.requestContext.data }

  // If the symbol is a full symbol (containing Exchange and Pair), split into the separate params
  if (isExchangeSymbol(originalRequest.base)) {
    const params = splitSymbol(originalRequest.base)

    // If exchange is provided in request, prefer that over the exchange split from the symbol
    const exchange = originalRequest.exchange || params.exchange

    req.requestContext.data.base = params.base
    req.requestContext.data.quote = params.quote
    req.requestContext.data.exchange = exchange

    logger.debug(
      `FX symbol detected, extracting ${JSON.stringify(originalRequest)} into ${JSON.stringify(
        req.requestContext.data,
      )}`,
    )

    return
  }
}

// Check that the exchange is in our list of exchange configs, else throw an error
const validateExchange = (req: AdapterRequest<typeof inputParameters.validated>) => {
  const exchange = req.requestContext.data.exchange

  if (exchange && exchanges[exchange] == undefined) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `'${exchange}' is not a supported exchange, must be one of [${Object.keys(
        exchanges,
      ).join(', ')}]`,
    })
  }
}

// Explicitly sets the requested endpoint alias into requestContext.data.endpointName, so it is available in the subscription set
const setEndpointName = (req: AdapterRequest<typeof inputParameters.validated>) => {
  req.requestContext.data.endpointName = (
    req.body.data as unknown as typeof inputParameters.validated & { endpoint?: string }
  ).endpoint
}

export const buildQuoteEndpoint = (overrides?: Record<string, string>) =>
  new PriceEndpoint<BaseEndpointTypes>({
    name: 'quote',
    aliases: [
      'common',
      'stock',
      'forex',
      'commodities',
      'forex-quote',
      'equity-quote',
      'commodity-quote',
    ],
    transportRoutes: new TransportRoutes<BaseEndpointTypes>()
      .register('ws', wsTransport)
      .register('rest', httpTransport),
    defaultTransport: 'rest',
    customRouter: (_req, adapterConfig) => (adapterConfig.WS_ENABLED ? 'ws' : 'rest'),
    requestTransforms: [requestTransform, validateExchange, setEndpointName],
    inputParameters: inputParameters,
    overrides,
  })

export const endpoint = buildQuoteEndpoint()
