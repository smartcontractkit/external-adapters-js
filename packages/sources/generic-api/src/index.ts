import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { http, multiHttp } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: http.name,
  name: 'GENERIC_API',
  config,
  endpoints: [http, multiHttp],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 20,
        note: 'Rate Limiter is shared across all feeds',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
