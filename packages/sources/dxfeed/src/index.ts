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

// Spec data_source_authentication.breaking_change_env_checks: the legacy-path
// and embedded-URL-credential checks on WS_API_ENDPOINT are STARTUP checks — a
// boot pointing WS_API_ENDPOINT at the deleted transport (or at a URL carrying
// embedded credentials) must fail. The framework runs config.validate() at
// server initialize (expose), so module import runs it here to gate every boot
// path (the same validate() then re-runs idempotently at expose). The checks
// run only when WS_API_ENDPOINT is set: with no WS variables at all the boot
// succeeds (the REST-only boot, owner decision rest_transport_scope=keep_untouched
// — the WS-path credential requirement is a request-time gate on the endpoints'
// customInputValidation). The default logger factory is set first: validate fns
// log (the REST default-endpoint warning) and the framework sets the factory
// only later, inside initialize().
LoggerFactoryProvider.set()
config.validate()

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
