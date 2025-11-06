import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/accrued-interest'

export const inputParameters = new InputParameters(
  {
    contractAddress: {
      required: true,
      type: 'string',
      description: 'The contract address of the token to get accrued interest for',
    },
  },
  [
    {
      contractAddress: 'E123456789qwertyuiopASDFGHJKLzxcvbnm12345678',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      token_name: string
      contract_address: string
      outstanding_interest_accrued: string
      as_of_datetime: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'accrued-interest',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
