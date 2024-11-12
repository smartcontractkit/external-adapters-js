import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { accountsTransport } from '../transport/accounts'

export const inputParameters = new InputParameters(
  {
    accountIDs: {
      aliases: ['ibanIDs'],
      required: true,
      type: 'string',
      description: 'The account ID that balances',
      array: true,
    },
    currency: {
      type: 'string',
      description: 'The currency the balance should be aggregated for',
      default: 'GBP',
    },
  },
  [
    {
      accountIDs: ['GB44CLRB04084000000010'],
      currency: 'GBP',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'accounts',
  aliases: [],
  transport: accountsTransport,
  inputParameters,
})
