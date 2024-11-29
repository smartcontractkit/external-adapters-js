import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'

import { httpTransport } from '../transport/price-http'
import { socketioTransport } from '../transport/price-socketio'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'FRAX',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('rest', httpTransport)
    .register('socketio', socketioTransport),
  inputParameters,
  defaultTransport: 'socketio',
})
