import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { config } from './config'
import { wallet } from './endpoint'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'

export const adapter = new PoRAdapter({
  defaultEndpoint: wallet.name,
  name: 'BITGO',
  config,
  endpoints: [wallet],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
        note: 'Docs: 360 requests per minute per auth',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
export const walletParameters = wallet.inputParameters
