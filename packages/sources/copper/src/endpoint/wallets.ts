import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { walletsTransport } from '../transport/wallets'

export const inputParameters = new InputParameters(
  {
    priceOracles: {
      required: true,
      description:
        'Configuration of the on-chain price oracle that provides real-time token valuations.',
      type: {
        token: {
          required: true,
          type: 'string',
          description: 'Symbol of the token to fetch price data for (e.g., ETH, SOL).',
        },
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Contract address of the price oracle used to fetch token price data.',
        },
        chainId: {
          required: true,
          type: 'string',
          description:
            'Blockchain network Id of the price oracle contract (e.g., ETHEREUM, ARBITRUM).',
        },
      },
      array: true,
    },
    portfolioId: {
      description: 'The portfolio ID to query.',
      type: 'string',
      required: false,
    },
    currencies: {
      description: 'The list of currency symbols to query.',
      type: 'string',
      array: true,
      required: false,
    },
  },
  [
    {
      priceOracles: [
        {
          token: 'ETH',
          contractAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
          chainId: '1',
        },
        {
          token: 'SOL',
          contractAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
          chainId: '42161',
        },
      ],
      portfolioId: 'cme14144g001y3b6k5x9gljwp',
      currencies: ['ETH', 'SOL', 'USDC', 'USDT', 'USTB', 'ETH', 'SOL'],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      totalUsdValue: string
      decimal: number
      totalUsdValueInHex: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'wallets',
  transport: walletsTransport,
  inputParameters,
})
