import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    asset: {
      aliases: ['symbol'],
      required: true,
      type: 'string',
      description: 'Asset price to request from Data Provider',
    },
  },
  [
    {
      asset: 'AAPLon',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  transport: httpTransport,
  inputParameters,
})
