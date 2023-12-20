import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { gmTokenTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      options: ['WETH', 'ETH', 'SOL', 'BTC', 'ARB', 'LINK', 'DOGE', 'UNI', 'XRP', 'LTC'],
      description:
        'Index token.  Long and short tokens will be opened / closed based on this price feed.',
    },
    long: {
      required: true,
      type: 'string',
      options: ['SOL', 'WBTC.b', 'WETH', 'ETH', 'ARB', 'LINK', 'UNI'],
      description: 'Long token. This is the token that will back long positions.',
    },
    short: {
      required: true,
      type: 'string',
      options: ['USDC'],
      description: 'Short token. This is the token that will back short positions.',
    },
    market: {
      required: true,
      type: 'string',
      description: 'Market address of the market pool.',
    },
  },
  [
    {
      index: 'LINK',
      long: 'LINK',
      short: 'USDC',
      market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  transport: gmTokenTransport,
  inputParameters,
})
