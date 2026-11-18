import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { reservesTransport } from '../transport/reserves'

export const inputParameters = new InputParameters(
  {
    portfolio: {
      required: true,
      type: 'string',
      description: 'The AMINA portfolio number that holds the position',
    },
    isin: {
      required: true,
      type: 'string',
      description: 'The ISIN of the position to publish',
    },
  },
  [
    {
      portfolio: '910000001',
      isin: 'XS0000000001',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse & {
    Data: {
      aum: number
      validFromTimestamp: number
      observationsTimestamp: number
      expiresAt: number
      ripcordAsInt: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserves',
  aliases: [],
  transport: reservesTransport,
  inputParameters,
})
