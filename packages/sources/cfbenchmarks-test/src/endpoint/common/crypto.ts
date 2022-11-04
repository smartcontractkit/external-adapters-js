import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/routing'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { transport as rest, transportSecondary as restSecondary } from '../rest/crypto'
import {
  transport as websocket,
  transportSecondary as websocketSecondary,
} from '../websocket/crypto'
import { customSettings } from '../../config'

export type Params = { index?: string; base?: string; quote?: string }

const extendedInputParameters: InputParameters = {
  index: {
    description: 'The ID of the index. Takes priority over base/quote when provided.',
    type: 'string',
    required: false,
  },
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: false,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: false,
  },
}

export const inputParameters = {
  ...priceEndpointInputParameters,
  ...extendedInputParameters,
}

export type EndpointTypes = {
  Request: {
    Params: Params
  }
  Response: {
    Data: EmptyObject
    Result: number
  }
  CustomSettings: typeof customSettings
}

const idOverrideFromBaseQuote: { [base: string]: { [quote: string]: string } } = {
  BTC: {
    USD: 'BRTI',
  },
}
export const overrideId = (base: string, quote: string): string | undefined =>
  idOverrideFromBaseQuote[base][quote]

export const getPrimaryId = (base: string, quote: string): string => `${base}/${quote}_RTI`
export const getSecondaryId = (base: string, quote: string): string => `U_${base}/${quote}_RTI`

export const getIdFromBaseQuote = (
  base: string,
  quote: string,
  type: 'primary' | 'secondary',
): string => {
  const override = overrideId(base, quote)
  if (override) return override

  if (type === 'secondary') return getSecondaryId(base, quote)
  return getPrimaryId(base, quote)
}

const overridenBaseQuoteFromId: { [id: string]: { base: string; quote: string } } = {
  BRTI: { base: 'BTC', quote: 'USD' },
}
export const getBaseQuoteFromId = (id: string): { base: string; quote: string } => {
  const override = overridenBaseQuoteFromId[id]
  if (override) return override

  const noPrefix = id.replace('U_', '')
  const noSuffix = noPrefix.replace('_RTI', '')
  const [base, quote] = noSuffix.split('/')
  return { base, quote }
}

export const additionalInputValidation = (
  { index, base, quote }: Params,
  shouldThrowError = false,
): void => {
  // Base and quote must be provided or index must be provided
  if (!(index || (base && quote))) {
    const missingInput = !index ? 'index' : 'base /or quote'
    if (shouldThrowError) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: missing ${missingInput} input parameters`,
      })
    }
  }
}

export const routingTransport = new RoutingTransport(
  { websocket, rest, restSecondary, websocketSecondary },
  ({ requestContext: { data: params } }, config) => {
    additionalInputValidation(params)

    /* [TODO]: once framework level transport selectors are added to request use here to route */
    if (config?.API_SECONDARY) {
      if (config?.WS_ENABLED) return 'websocketSecondary'
      return 'restSecondary'
    }

    if (config?.WS_ENABLED) return 'websocket'
    return 'rest'
  },
)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  aliases: ['values', 'price'], // Legacy aliases
  transport: routingTransport,
  inputParameters,
})
