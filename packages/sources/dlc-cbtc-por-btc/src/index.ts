import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserves } from './endpoint/reserves'

export const adapter = new Adapter({
  name: 'DLC_CBTC_BTC_POR',
  defaultEndpoint: reserves.name,
  config,
  endpoints: [reserves],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'Conservative rate limit due to multiple blockchain API calls per request',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
