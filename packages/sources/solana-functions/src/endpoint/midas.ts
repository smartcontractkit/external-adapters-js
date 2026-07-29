import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { midasTransport } from '../transport/midas'

export const inputParameters = new InputParameters(
  {
    feedStateAddress: {
      description: 'The state account address for the program',
      type: 'string',
      required: true,
    },
  },
  [
    {
      feedStateAddress: '7UVwLrMTEDVvzQRaitJi7YLJcxFY8RTmXrHvSPMjTGDm',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string // in 18 decimals
      decimals: number // 18
      price: number // human readable
      rawPrice: string // scaled to 18 decimals
      minPrice: number // human readable
      maxPrice: number // human readable
      lastUpdatedAt: number // in seconds
      secondsSinceLastUpdate: number
      maxStaleness: number // in seconds
      ripcordAsInt: 0 | 1
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'midas',
  aliases: [],
  transport: midasTransport,
  inputParameters,
})
