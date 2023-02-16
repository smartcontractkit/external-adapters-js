import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  CryptoPriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { makeRestTransport } from '../rest/crypto'
import { makeWsTransport } from '../websocket/crypto'
import { customSettings } from '../../config'
import { getIdFromBaseQuote } from '../../utils'

export type Params = { index?: string; base?: string; quote?: string }
type RequestParams = { Params: Params }

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
  Request: RequestParams
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
}

export const additionalInputValidation = ({ index, base, quote }: Params): void => {
  // Base and quote must be provided OR index must be provided
  if (!(index || (base && quote))) {
    const missingInput = !index ? 'index' : 'base /or quote'
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: missing ${missingInput} input parameters`,
    })
  }
}

export const cryptoRequestTransform = (req: AdapterRequest<RequestParams>): void => {
  // TODO: Move additional input validations to proper location after framework supports it
  additionalInputValidation(req.requestContext.data)
  if (!req.requestContext.data.index) {
    const isSecondary = process.env.API_SECONDARY
    const type = isSecondary ? 'secondary' : 'primary'
    // If there is no index set
    // we know that base and quote exist from the extra input validation above
    // coerce to strings
    req.requestContext.data.index = getIdFromBaseQuote(
      req.requestContext.data.base as string,
      req.requestContext.data.quote as string,
      type,
    )
  }
  // Clear base quote to ensure an exact match in the cache with index
  delete req.requestContext.data.base
  delete req.requestContext.data.quote
}

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    rest: makeRestTransport('primary'),
    restSecondary: makeRestTransport('secondary'),
    websocket: makeWsTransport('primary'),
    websocketSecondary: makeWsTransport('secondary'),
  },
  (_, config) => {
    if (config.API_SECONDARY) {
      if (config.WS_ENABLED) return 'websocketSecondary'
      return 'restSecondary'
    }

    if (config.WS_ENABLED) return 'websocket'
    return 'rest'
  },
)

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'crypto',
  aliases: ['values', 'price'], // Legacy aliases
  transport: routingTransport,
  inputParameters,
})

export const requestTransforms = [cryptoRequestTransform]
