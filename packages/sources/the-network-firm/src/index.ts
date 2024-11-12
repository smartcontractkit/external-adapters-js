import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { backed, eurr, gift, mco2, stbt, usdr } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: mco2.name,
  name: 'THE_NETWORK_FIRM',
  config,
  endpoints: [backed, eurr, gift, mco2, stbt, usdr],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
