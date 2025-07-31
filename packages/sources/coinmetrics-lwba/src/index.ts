import { makeConfig } from '@chainlink/coinmetrics-adapter/config'
import { endpoint } from '@chainlink/coinmetrics-adapter/endpoint/lwba'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

export const config = makeConfig({
  NAME: 'COINMETRICS_LWBA',
  API_ENDPOINT: {
    description: 'Unused in LWBA',
    type: 'string',
    required: false,
  },
})

const newEndpoint = Object.assign(Object.create(Object.getPrototypeOf(endpoint)), endpoint)
newEndpoint.aliases.push('crypto', 'price')

export const adapter = new Adapter({
  defaultEndpoint: newEndpoint.name,
  name: 'COINMETRICS_LWBA',
  config,
  endpoints: [newEndpoint],
  rateLimiting: {
    tiers: {
      community: {
        rateLimit1m: 100,
      },
      paid: {
        rateLimit1s: 300,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
