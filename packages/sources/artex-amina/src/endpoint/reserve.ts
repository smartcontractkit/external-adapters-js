import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { InputParameter } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { httpTransport } from '../transport/reserve'

type RequiredStringInput = InputParameter & { type: 'string'; required: true }

export const inputParameters = new InputParameters<{
  portfolio: RequiredStringInput
  isin: RequiredStringInput
}>(
  {
    portfolio: {
      type: 'string',
      required: true,
      description: 'The number of the portfolio whose positions are read',
    },
    isin: {
      type: 'string',
      required: true,
      description: 'The ISIN of the single position to report',
    },
  },
  [
    {
      portfolio: '900000001',
      isin: 'DE0000000001',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse & {
    Data: {
      result: number
      ripcord: boolean
      ripcordAsInt: number
      aum: number
      navPerShare: number
      navDate: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserve',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
