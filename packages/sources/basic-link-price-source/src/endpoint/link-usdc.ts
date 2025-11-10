import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { linkUsdcTransport } from '../transport/link-usdc'

export const endpoint = new CryptoPriceEndpoint({
  name: 'link-usdc',
  transport: linkUsdcTransport,
  inputParameters: {
    base: { type: 'string', required: true, default: 'LINK' },
    quote: { type: 'string', required: true, default: 'USDC' },
    chain: {
      type: 'string',
      required: false,
      default: 'ethereum',
      options: ['ethereum', 'arbitrum'],
    },
  },
  config,
})
