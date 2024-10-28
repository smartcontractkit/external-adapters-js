import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { navConsultingTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    fund: {
      required: true,
      type: 'string',
      description:
        'Name of the fund, used to select ${fund}_API_KEY ${fund}_SECRET_KEY from env variables',
    },
  },
  [
    {
      fund: 'Adapt3r',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserve',
  transport: navConsultingTransport,
  inputParameters,
})
