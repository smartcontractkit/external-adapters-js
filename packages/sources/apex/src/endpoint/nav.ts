import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { navTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    accountName: {
      required: true,
      type: 'string',
      description: 'The account name to query',
    },
  },
  [
    {
      accountName: 'EXAMPLE',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: navTransport,
  inputParameters,
})
