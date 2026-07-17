import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { twapTransport } from '../transport/twap'

export const inputParameters = new InputParameters(
  {
    feedId: {
      required: true,
      type: 'string',
      description: 'The feed ID to query TWAP for',
    },
    windowSeconds: {
      required: true,
      type: 'number',
      description: 'The time window in seconds to compute TWAP over',
    },
    endTs: {
      required: false,
      type: 'number',
      description: 'The end timestamp (Unix seconds) for the TWAP window.',
    },
  },
  [
    {
      feedId: '0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9',
      windowSeconds: 30,
      endTs: 1730000000,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string | null
    Data: {
      result: string
      feedId: string
      samples: number
      decimals: number
      windowStartTs: number
      windowEndTs: number
      effectiveWindowStartTs: number
      effectiveWindowEndTs: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'twap',
  aliases: [],
  transport: twapTransport,
  inputParameters,
})
