import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { functionTransport } from '../transport/function'

export const inputParameters = new InputParameters({
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
  shouldDecode: {
    type: 'boolean',
    description: 'Should decode the result',
    default: false,
  },
  decimals: {
    type: 'number',
    description: 'Decimals to use for the decoded result',
    default: 18,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
      decodedResult?: string | number
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
