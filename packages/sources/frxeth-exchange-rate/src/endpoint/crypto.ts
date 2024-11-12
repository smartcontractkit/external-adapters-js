import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { exchangeRateTransport } from '../transport/exchange-rate'
import overrides from '../config/overrides.json'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    priceType: {
      description: "The price type to fetch, either 'HIGH' or 'LOW'.",
      required: true,
      options: ['HIGH', 'LOW', 'high', 'low'],
      type: 'string',
    },
  },
  [
    {
      priceType: 'high',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto',
  aliases: [],
  transport: exchangeRateTransport,
  inputParameters: inputParameters,
  overrides: overrides['frxeth-exchange-rate'],
})
