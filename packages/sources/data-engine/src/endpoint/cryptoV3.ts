import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { cryptoV3Transport } from '../transport/cryptoV3'
import { commonInputParams } from './common'

export const inputParameters = new InputParameters(
  {
    ...commonInputParams,
  },
  [
    {
      feedId: '0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string | null
    Data: {
      bid: string
      ask: string
      price: string
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-v3',
  aliases: [],
  transport: cryptoV3Transport,
  inputParameters,
})
