import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'

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
  transport: socketioTransport,
  inputParameters,
  defaultTransport: 'ws',
})
