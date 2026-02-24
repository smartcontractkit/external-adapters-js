import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/reserves'

export const inputParameters = new InputParameters(
  {
    client: {
      required: true,
      type: 'string',
      description: 'The client identifier (e.g. syrupusdt, syrupusdc)',
    },
  },
  [
    {
      client: 'syrupusdc',
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
