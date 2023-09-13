import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { BaseSettingsDefinition } from '@chainlink/external-adapter-framework/config'
import { config } from './config'
import { addresses, members } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: addresses.name,
  name: 'WBTC',
  config,
  endpoints: [addresses, members],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

// Remove validations for these specific env vars.
// This is a very ugly workaround, and might not work with slightly breaking changes in the framework.
// It is only meant to serve as a temporary measure because the provider API is not reliable.
;(BaseSettingsDefinition.CACHE_MAX_AGE.validate as unknown) = undefined
;(BaseSettingsDefinition.WARMUP_SUBSCRIPTION_TTL.validate as unknown) = undefined

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
