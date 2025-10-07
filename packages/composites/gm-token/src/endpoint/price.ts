import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { gmTokenTransport } from '../transport/price'

export const CHAIN_OPTIONS = ['arbitrum', 'botanix']

export const inputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      description:
        'Index token.  Long and short tokens will be opened / closed based on this price feed.',
    },
    long: {
      required: true,
      type: 'string',
      description: 'Long token. This is the token that will back long positions.',
    },
    short: {
      required: true,
      type: 'string',
      description: 'Short token. This is the token that will back short positions.',
    },
    market: {
      required: true,
      type: 'string',
      description: 'Market address of the market pool.',
    },
    chain: {
      description: 'Target chain for GM market',
      type: 'string',
      options: [...CHAIN_OPTIONS],
      default: 'arbitrum',
    },
  },
  [
    {
      index: 'LINK',
      long: 'LINK',
      short: 'USDC',
      market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
      chain: 'arbitrum',
    },
  ],
)

export type ChainKey = (typeof inputParameters.validated)['chain']

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
