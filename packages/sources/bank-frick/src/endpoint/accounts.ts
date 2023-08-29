import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/accounts'
import { AdapterInputParameters } from '../transport/utils'

export const inputParameters = new InputParameters({
  ibanIDs: {
    description: 'The list of account ids included in the sum of balances',
    required: true,
    type: 'string',
    array: true,
  },
  signingAlgorithm: {
    description:
      'What signing algorithm is used to sign and verify authorization data, one of rsa-sha256, rsa-sha384, or rsa-sha512',
    required: false,
    type: 'string',
    default: 'rsa-sha512',
    options: ['rsa-sha256', 'rsa-sha384', 'rsa-sha512'],
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const accountsRestEndpoint = new AdapterEndpoint({
  name: 'accounts',
  transport,
  inputParameters,
  cacheKeyGenerator: (data) => {
    const sortedData = Object.keys(data)
      .sort()
      .reduce((a: Record<string, unknown>, i: string) => {
        a[i] = data[i as keyof AdapterInputParameters]
        return a
      }, {})
    return `accounts-${JSON.stringify(sortedData)}`
  },
})
