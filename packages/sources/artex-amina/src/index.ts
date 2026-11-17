import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { reserve } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: reserve.name,
  name: 'ARTEX_AMINA',
  config,
  endpoints: [reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'AMINA documents no rate limit for read-only calls; keep the read-only poll light.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
