import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { sharePrice } from './endpoint'

export const adapter = new Adapter({
  name: 'DECIBEL_VAULT',
  defaultEndpoint: sharePrice.name,
  config,
  endpoints: [sharePrice],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 10,
        note: 'Aptos fullnode REST API default rate limit',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
