import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/cumulativeAmount'

export const inputParameters = new InputParameters(
  {
    auditorAddress: {
      required: true,
      type: 'string',
      description:
        'The address that should have been used to sign the message reporting the cumulative amount',
    },
    fractionalContractAddress: {
      required: true,
      type: 'string',
      description: 'Contract address for which to query the cumulative amount',
    },
    chainId: {
      required: true,
      type: 'number',
      description: 'The chain ID of the blockchain where the contract is deployed',
    },
  },
  [
    {
      auditorAddress: '0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc',
      fractionalContractAddress: '0xd051c326C9Aef673428E6F01eb65d2C52De95D30',
      chainId: 1,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'cumulativeAmount',
  aliases: [],
  transport: httpTransport,
  inputParameters,
  overrides: overrides['ix-trust-sync'],
})
