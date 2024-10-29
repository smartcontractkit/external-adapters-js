import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { httpTransport } from '../transport/balance'
import { getApiKeys } from '../transport/utils'

export const inputParameters = new InputParameters(
  {
    portfolio: {
      required: true,
      type: 'string',
      description: 'The portfolio ID to query the balance of',
    },
    symbol: {
      required: true,
      type: 'string',
      description: 'The symbol to return the balance for',
    },
    type: {
      type: 'string',
      description: 'The balance type to return',
      default: 'total',
      options: ['total', 'vault', 'trading'],
    },
    apiKey: {
      type: 'string',
      description:
        'Alternative api keys to use for this request, ${apiKey}_ACCESS_KEY ${apiKey}_PASSPHRASE ${apiKey}_SIGNING_KEY required in environment variables',
      default: '',
    },
  },
  [
    {
      portfolio: 'abcd1234-123a-1234-ab12-12a34bcd56e7',
      symbol: 'BTC',
      type: 'total',
      apiKey: '',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'balance',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request, settings): AdapterError | undefined => {
    if (request.requestContext.data.apiKey) {
      getApiKeys(request.requestContext.data.apiKey, settings)
    }
    return
  },
})
