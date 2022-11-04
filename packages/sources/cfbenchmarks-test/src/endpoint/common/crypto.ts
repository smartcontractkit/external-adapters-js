import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  PriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/routing'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { makeRestTransport } from '../rest/crypto'
import { makeWsTransport } from '../websocket/crypto'
import { customSettings } from '../../config'

export type Params = { index?: string; base?: string; quote?: string }

const inputParameters: InputParameters & PriceEndpointInputParameters = {
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

export const additionalInputValidation = (
  { index, base, quote }: Params,
  shouldThrowError = false,
): void => {
  // Base and quote must be provided OR index must be provided
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
  {
    rest: makeRestTransport('primary'),
    restSecondary: makeRestTransport('secondary'),
    websocket: makeWsTransport('primary'),
    websocketSecondary: makeWsTransport('secondary'),
  },
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
