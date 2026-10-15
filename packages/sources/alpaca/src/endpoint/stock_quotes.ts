import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/stock_quotes'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol'],
      type: 'string',
      required: true,
      description:
        'Bare ticker as quoted by the provider, e.g. AAPL. Class shares use dot suffix (BRK.B).',
    },
    quote: {
      aliases: ['to', 'market'],
      type: 'string',
      required: true,
      description: 'Quote currency as requested, e.g. USD.',
    },
    requireVolume: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'If true, throw error if bid/ask volume is invalid (for compatibility reasons).',
    },
    isOvernight: {
      type: 'boolean',
      required: false,
      default: false,
      description:
        'If true, only accept qualifying exchange codes (for compatibility reasons; no-op on overnight frames).',
    },
  },
  [
    {
      base: 'AAPL',
      quote: 'USD',
      requireVolume: false,
      isOvernight: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  transport: wsTransport,
  inputParameters,
  // Both flags default to false. Dropping them when false keeps them out of the feedId and gives a
  // request without the flags the same cache entry as one with them set to false.
  requestTransforms: [
    (req) => {
      const data = req.requestContext.data as Partial<typeof req.requestContext.data>
      if (!data.requireVolume) delete data.requireVolume
      if (!data.isOvernight) delete data.isOvernight
    },
  ],
})
