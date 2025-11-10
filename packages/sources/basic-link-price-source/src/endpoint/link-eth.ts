import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { linkEthTransport } from '../transport/link-eth'

export const endpoint = new CryptoPriceEndpoint({
  name: 'link-eth',
  aliases: ['crypto', 'price'], // Optional: already added by CryptoPriceEndpoint
  transport: linkEthTransport,
  inputParameters: {
    base: {
      type: 'string',
      description: 'The base currency (e.g., LINK)',
      required: true,
      default: 'LINK',
    },
    quote: {
      type: 'string',
      description: 'The quote currency (e.g., ETH)',
      required: true,
      default: 'ETH',
    },
    chain: {
      type: 'string',
      description: 'Blockchain to query',
      required: false,
      default: 'ethereum',
      options: ['ethereum', 'arbitrum'],
    },
  },
  config,
})
