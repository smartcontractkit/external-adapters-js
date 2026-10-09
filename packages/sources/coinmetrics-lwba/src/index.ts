import { makeConfig } from '@chainlink/coinmetrics-adapter/config'
import { endpointParameters } from '@chainlink/coinmetrics-adapter/endpoint/lwba'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter, LwbaEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export const config = makeConfig({
  NAME: 'COINMETRICS_LWBA',
  API_ENDPOINT: {
    description: 'Unused in LWBA',
    type: 'string',
    required: false,
  },
})

// Construct a fresh endpoint instead of cloning the coinmetrics one: the AdapterEndpoint
// constructor binds requestTransforms (symbolOverrider) to the instance it creates, and only
// this instance is initialize()d, so RDD overrides resolve against this adapter's name.
export const endpoint = new LwbaEndpoint({
  ...endpointParameters,
  aliases: [...endpointParameters.aliases, 'crypto', 'price'],
  customOutputValidation: (resp: AdapterResponse): AdapterError | undefined => {
    if (!resp.errorMessage) {
      const mid = (resp.data as any)?.mid
      if (mid !== undefined) {
        resp.result = mid
      }
    }
    return // no validation error
  },
})

export const adapter = new Adapter({
  defaultEndpoint: endpoint.name,
  name: 'COINMETRICS_LWBA',
  config,
  endpoints: [endpoint],
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
