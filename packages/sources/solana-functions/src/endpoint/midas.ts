import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { anchorDataTransport } from '../transport/anchor-data'

export const inputParameters = new InputParameters(
  {
    stateAccountAddress: {
      description: 'The state account address for the program',
      type: 'string',
      required: true,
    },
    account: {
      description: 'The name of the account to retrieve from the IDL',
      type: 'string',
      required: true,
    },
    field: {
      description: 'The name of the field to retrieve from the state account',
      type: 'string',
      required: true,
    },
  },
  [
    {
      stateAccountAddress: '3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb',
      account: 'FundAccount',
      field: 'one_receipt_token_as_sol',
    },
  ],
)

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
  name: 'anchor-data',
  aliases: [],
  transport: anchorDataTransport,
  inputParameters,
})
