import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    ticker: {
      aliases: ['symbol', 'fundId'],
      required: true,
      type: 'string',
      description: 'The symbol of the fund ticker to query',
    },
  },
  [
    {
      ticker: 'WTGXX',
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
