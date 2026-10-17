import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { price, stockQuote } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'DXFEED',
  config,
  endpoints: [price, stockQuote],
  rateLimiting: {
    tiers: {
      unlimited: {
        rateLimit1s: 100,
        note: 'Dxfeed does not describe a rate limit, but setting reasonable limits',
      },
    },
  },
})

// Spec data_source_authentication.breaking_change_env_checks: the legacy-path,
// embedded-URL-credentials and credential-pair checks are STARTUP checks — the
// boot must fail on them. The framework runs config.validate() only at server
// initialize (expose), so module import runs it here to gate every boot path
// (the same validate() then re-runs idempotently at expose). The default logger
// factory is set first: validate fns log (the REST default-endpoint warning)
// and the framework sets the factory only later, inside initialize().
LoggerFactoryProvider.set()
config.validate()

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
