import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../../config'
import overrides from '../../config/overrides.json'
import { httpTransport } from '../http/iex'
import { wsTransport } from '../ws/iex'

const inputParameters = new InputParameters({
  base: {
    aliases: ['ticker', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
})

export type IEXEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'iex',
  aliases: ['stock'],
  transportRoutes: new TransportRoutes<IEXEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
