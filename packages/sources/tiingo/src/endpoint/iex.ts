import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/iex-http'
import { wsTransport } from '../transport/iex-ws'

const inputParameters = new InputParameters({
  base: {
    aliases: ['ticker', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'iex',
  aliases: ['stock'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
