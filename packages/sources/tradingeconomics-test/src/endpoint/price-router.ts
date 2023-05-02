import { wsTransport } from './price-ws'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { httpTransport } from './price'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin', 'asset'],
    required: true,
    description: 'The symbol of symbols of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'term'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
    default: 'USD',
  },
})

export const requestTransform = (req: AdapterRequest<typeof inputParameters.validated>): void => {
  const base = req.requestContext.data.base
  const quote = req.requestContext.data.quote
  const regex = /[A-Z]{3}[A-Z]{3}:CUR/

  if (!regex.test(base)) {
    const newBase = `${base}${quote}:CUR`
    if (!regex.test(newBase)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: there's an error with the parameters format`,
      })
    }
    req.requestContext.data.base = newBase
  }
  req.requestContext.data.quote = ''
}

const requestTransforms = [requestTransform]

// Common endpoint type shared by the REST and WS transports
export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const transportRoutes = new TransportRoutes<EndpointTypes>()
  .register('ws', wsTransport)
  .register('rest', httpTransport)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  transportRoutes,
  inputParameters,
  defaultTransport: 'rest',
  overrides: overrides.tradingeconomics,
  requestTransforms,
})
