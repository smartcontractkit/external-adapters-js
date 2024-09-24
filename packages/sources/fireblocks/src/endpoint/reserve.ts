import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { httpTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    accountName: {
      type: 'string',
      description: 'The name of the account to retrieve balances for',
      required: true,
    },
  },
  [
    {
      accountName: 'USDFB',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserve',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
