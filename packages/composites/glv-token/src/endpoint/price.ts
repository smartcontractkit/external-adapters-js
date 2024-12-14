import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { glvTokenTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    glv: {
      required: true,
      type: 'string',
      description: 'Glv address',
    },
  },
  [
    {
      glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  transport: glvTokenTransport,
  inputParameters,
})
