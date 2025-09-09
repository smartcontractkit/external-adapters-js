import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { eUSXPriceTransport } from '../transport/eusx-price'

export const inputParameters = new InputParameters(
  {
    address: {
      description: 'Program address to fetch from',
      type: 'string',
      required: true,
    },
  },
  [
    {
      address: 'eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: number
      vestingSchedule: {
        start: number
        end: number
        vestingAmount: number
      }
      yieldPool: {
        sharesSupply: number
        totalAssets: number
      }
      unvestedAmount: number
    }
    Result: number
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'eusx-price',
  aliases: ['eusx', 'eusx-rate'],
  transport: eUSXPriceTransport,
  inputParameters,
})
