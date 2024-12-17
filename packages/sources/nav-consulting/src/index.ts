import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserve.name,
  name: 'NAV_CONSULTING',
  config,
  endpoints: [reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 4,
        note: '60/min in total shared by 30 EA instance, each EA can do 2 per min per API. Each call hits 2 API',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
