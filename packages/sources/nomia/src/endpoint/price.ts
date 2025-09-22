import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { nomiaTransport } from '../transport/price'

export const inputParameters = new InputParameters({
  query: {
    required: true,
    type: 'string',
    description: '',
  },
  singleYear: {
    required: false,
    type: 'boolean',
    default: false,
    description: '',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: nomiaTransport,
  inputParameters,
})
