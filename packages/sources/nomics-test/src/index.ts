import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
// import overrides from './config/overrides.json'
import { filtered } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: 'filtered',
  name: 'NOMICS',
  endpoints: [filtered],
  envDefaultOverrides: {
    API_ENDPOINT: 'https://api.nomics.com/v1',
  },
  // rateLimiting: {
  //   tiers: {
  //     "free": {
  //       "rateLimit1s": 2,
  //       "rateLimit1m": 60,
  //       "note": "1 req/s, presumably allows for bursts"
  //     },
  //     "paid": {
  //       "rateLimit1h": -1
  //     }
  //   },
  // },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
