import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { functionTransport } from '../transport/function'

export const inputParamDefinition = {
  signature: {
    type: 'string',
    aliases: ['function'],
    required: true,
    description:
      'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
  },
  address: {
    aliases: ['contract'],
    required: true,
    description: 'Address of the contract',
    type: 'string',
  },
  inputParams: {
    array: true,
    description: 'Array of function parameters in order',
    type: 'string',
  },
  network: {
    required: true,
    description: 'RPC network name',
    type: 'string',
  },
  additionalRequests: {
    description: 'Optional map of function calls',
    array: true,
    type: {
      name: {
        required: true,
        type: 'string',
        description: 'Unique name or identifier for this additional request',
      },
      signature: {
        required: true,
        type: 'string',
        description:
          'Function signature, formatted as human-readable ABI (e.g., balanceOf(address))',
      },
    },
    required: false,
  },
} as const

export const inputParameters = new InputParameters(inputParamDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'function',
  transport: functionTransport,
  inputParameters,
})
