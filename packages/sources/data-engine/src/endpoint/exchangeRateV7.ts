import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { exchangeRateV7Transport } from '../transport/exchangeRateV7'
import { commonInputParams } from './common'

export const inputParameters = new InputParameters(
  {
    ...commonInputParams,
  },
  [
    {
      feedId: '0x00070f4b71834a1b005b6c0f0ef3e3a2928aceaa51a1099f834e340e37ab498d',
      decimals: 0,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string | null
    Data: {
      exchangeRate: string
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'exchangeRate-v7',
  aliases: ['redemptionRate-v7'],
  transport: exchangeRateV7Transport,
  inputParameters,
})
