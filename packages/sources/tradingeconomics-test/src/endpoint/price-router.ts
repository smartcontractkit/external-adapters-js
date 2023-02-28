import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { EndpointTypes, wsTransport } from './price-ws'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { httpTransport } from './price'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
} as const

export const requestTransform = (req: AdapterRequest): void => {
  const base = req.requestContext.data.base as string
  const quote = req.requestContext.data.quote as string
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

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    rest: httpTransport,
    ws: wsTransport,
  },
  (_, adapterConfig) => {
    if (adapterConfig.WS_ENABLED) {
      return 'ws'
    }
    return 'rest'
  },
)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  transport: routingTransport,
  inputParameters,
})

export const requestTransforms = [requestTransform]
