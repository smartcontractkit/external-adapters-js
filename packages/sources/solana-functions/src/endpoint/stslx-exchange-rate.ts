import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stslxExchangeRateTransport } from '../transport/stslx-exchange-rate'

export const inputParameters = new InputParameters(
  {
    glamStateAddress: {
      description: 'The GLAM state account address for the stSLX vault',
      type: 'string',
      required: true,
    },
  },
  [
    {
      glamStateAddress: '5E2scHi8LyZAqZeVHnXLeFhwoePxD2CTdSruWmjgVEoB',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      slxBalance: string
      stslxSupply: string
      slxMintDecimals: number
      stslxMintDecimals: number
      glamStateAddress: string
      vaultAddress: string
      slxTokenAccountAddress: string
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
