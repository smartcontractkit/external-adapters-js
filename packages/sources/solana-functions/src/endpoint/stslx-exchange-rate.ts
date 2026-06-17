import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stslxExchangeRateTransport } from '../transport/stslx-exchange-rate'

// TODO: Add optional address inputs if future stSLX-like feeds need configurable accounts.
export const inputParameters = new InputParameters({}, [{}])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      rate: string
      decimals: number
      slxBalance: string
      stslxSupply: string
      slxMintDecimals: number
      stslxMintDecimals: number
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
