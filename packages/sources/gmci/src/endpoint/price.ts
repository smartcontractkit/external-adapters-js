import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { wsTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      description: 'Index name',
    },
  },
  [
    {
      index: 'GMCI30',
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
  aliases: [],
  transport: wsTransport,
  inputParameters,
  overrides: overrides['gmci'],
})
