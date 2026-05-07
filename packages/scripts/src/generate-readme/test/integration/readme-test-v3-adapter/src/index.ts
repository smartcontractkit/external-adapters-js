import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: price.name,
  // Adapter name
  name: 'README_TEST_V3',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [price],
  // Rate limit otherwise we send requests as fast as possible without delay.
  // You should adjust this based on what the data provider can tolerate and
  // how fresh you need your data to be. The rate limit is global for all
  // requests going through transport.dependencies.requester, which includes
  // the requests prepared in HttpTransport.prepareRequests.
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
