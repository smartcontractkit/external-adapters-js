import {
  AdapterEndpoint,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { glvLwbaTransport } from '../transport/lwba'

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

export type BaseEndpointTypesLwba = {
  Parameters: typeof inputParameters.definition
  Response: LwbaResponseDataFields & {
    Data: {
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  transport: glvLwbaTransport,
  inputParameters,
})
