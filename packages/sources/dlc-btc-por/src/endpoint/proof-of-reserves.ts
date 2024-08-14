import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { porTransport } from '../transport/proof-of-reserves'

export const inputParameters = new InputParameters(
  {
    network: {
      type: 'string',
      description:
        'The name of RPC network. If provided, it will be used as a suffix for RPC_URL, CHAIN_ID, and DLC_CONTRACT environment variables',
      required: false,
    },
  },
  [
    {
      network: 'arbitrum',
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
  inputParameters,
  transport: porTransport,
})
