import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stslxExchangeRateTransport } from '../transport/stslx-exchange-rate'

export const inputParameters = new InputParameters(
  {
    minRate: {
      description: 'Minimum allowed stSLX-SLX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: true,
    },
    maxRate: {
      description: 'Maximum allowed stSLX-SLX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: true,
    },
  },
  [
    {
      minRate: '950000000000000000',
      maxRate: '1050000000000000000',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      computedResult: string
      decimals: number
      minRate: string
      maxRate: string
      boundsApplied: boolean
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stslx-exchange-rate',
  aliases: [],
  transport: stslxExchangeRateTransport,
  inputParameters,
})
