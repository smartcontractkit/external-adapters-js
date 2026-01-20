import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { batchIndex } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: batchIndex.name,
  name: 'NOMIA2',
  config,
  endpoints: [batchIndex],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1h: 12,
        note: 'Docs: 500 requests per day per auth',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
