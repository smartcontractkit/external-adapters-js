import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { httpTransport } from '../transport/reserves'

export const inputParameters = new InputParameters(
  {
    providerEndpoint: {
      description: 'Which environment endpoint to choose',
      options: ['prod', 'staging', 'test'],
      type: 'string',
      required: true,
    },
  },
  [
    {
      providerEndpoint: 'prod',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  transport: httpTransport,
  inputParameters,
})
