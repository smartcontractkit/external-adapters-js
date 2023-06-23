import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/balance'

export const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    required: true,
    array: true,
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
    type: {
      address: {
        type: 'string',
        description: 'an address to get the balance of',
        required: true,
      },
    },
  },
})

export interface BalanceResponse {
  address: string
  balance: string
}

interface ResponseSchema {
  Data: {
    result: BalanceResponse[]
  }
  Result: null
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export const balanceEndpoint = new AdapterEndpoint({
  name: 'balance',
  transport,
  inputParameters,
})
