import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { wsTransport } from '../transport/stock_quotes'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol'],
      type: 'string',
      required: true,
      description: 'Bare US ticker, e.g. AAPL. Class shares use dot suffix (BRK.B).',
    },
    quote: {
      aliases: ['to', 'market'],
      type: 'string',
      required: true,
      description: 'Quote currency, USD for this feed.',
    },
    requireVolume: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'If true, throw error if bid/ask volume is invalid (dxfeed compat).',
    },
    isOvernight: {
      type: 'boolean',
      required: false,
      default: false,
      description:
        'If true, only accept qualifying exchange codes (dxfeed compat; no-op on Alpaca overnight frames).',
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
  overrides: overrides.alpaca,
})
