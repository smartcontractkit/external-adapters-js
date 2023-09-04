import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { wsTransport } from '../transport/forex-ws'

const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'market', 'asset'],
      required: true,
      type: 'string',
      description: 'The asset to query',
    },
    quote: {
      aliases: ['to'],
      required: true,
      type: 'string',
      description: 'The quote to convert to',
    },
  },
  [
    {
      base: 'GBP',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
