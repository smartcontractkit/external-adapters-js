import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { customSubscriptionTransport } from '../transport/crypto-lwba'

export const inputParameters = new InputParameters(
  {
    feedId: {
      required: true,
      type: 'string',
      description: 'The feedId for the token pair to query',
    },
  },
  [
    {
      feedId: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  aliases: [],
  transport: customSubscriptionTransport,
  inputParameters,
})
