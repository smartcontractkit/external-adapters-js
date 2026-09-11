import { makeConfig } from '@chainlink/coinmetrics-adapter/config'
import { endpoint } from '@chainlink/coinmetrics-adapter/endpoint/lwba'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
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

const newEndpoint = Object.assign(Object.create(Object.getPrototypeOf(endpoint)), endpoint)

// Object.assign copies `aliases` and `requestTransforms` by reference, so give the clone its own
// arrays rather than mutating the ones still shared with `endpoint`.
newEndpoint.aliases = [...(endpoint.aliases ?? []), 'crypto', 'price']

// `symbolOverrider` was bound to `endpoint` in the AdapterEndpoint constructor, but only the clone
// is ever initialize()d — so the inherited binding reads `adapterName` as undefined, the override
// lookup misses, and every RDD symbol override is silently dropped. Rebind it to the clone.
newEndpoint.requestTransforms = [
  newEndpoint.symbolOverrider.bind(newEndpoint),
  ...endpoint.requestTransforms.slice(1),
]

const originalValidate = endpoint.customOutputValidation
newEndpoint.customOutputValidation = (resp: AdapterResponse): AdapterError | undefined => {
  const err = originalValidate?.(resp)
  if (err) {
    return err
  }
  if (!resp.errorMessage) {
    const mid = (resp.data as any)?.mid
    if (mid !== undefined) {
      resp.result = mid
    }
  }
  return undefined // no validation error
}

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
