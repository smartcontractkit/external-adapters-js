import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { backed, emgemx, eurr, gift, reserve, stbt, uranium, usdr } from './endpoint'

export const adapter = new PoRAdapter({
  name: 'THE_NETWORK_FIRM',
  config,
  endpoints: [backed, emgemx, eurr, gift, stbt, uranium, usdr, reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
