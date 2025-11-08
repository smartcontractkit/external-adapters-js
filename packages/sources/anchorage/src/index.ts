import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { packages, wallet } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: wallet.name,
  name: 'ANCHORAGE',
  config,
  endpoints: [wallet, packages],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
        note: 'Docs: 10 requests per second per Organization, bursts of up to 100 requests per second',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
export const walletParameters = wallet.inputParameters
