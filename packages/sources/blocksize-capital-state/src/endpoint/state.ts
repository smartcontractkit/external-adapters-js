import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stateTransport } from '../transport/state'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      aliases: ['to', 'market'],
      required: false,
      type: 'string',
      default: 'USD',
      description: 'The symbol of the currency to convert to',
      options: ['USD', 'ETH'],
    },
  },
  [
    {
      base: 'CBBTC',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>().register('ws', stateTransport),
  defaultTransport: 'ws',
  inputParameters,
})
