import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { transport } from '../transport/trust'

export const inputParameters = new InputParameters({
  chain_id: {
    type: 'number',
    description: 'The chain ID of the deployment (e.g. 11155111 for Sepolia)',
    required: true,
  },
  auditor_address: {
    type: 'string',
    description: 'The auditor/attestor wallet address',
    required: true,
  },
  fractional_contract_address: {
    type: 'string',
    description: 'The fractional token contract address',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'trust',
  transport,
  inputParameters,
})
