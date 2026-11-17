import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ssa } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: ssa.name,
  name: 'SP_SSA',
  config,
  endpoints: [ssa],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 300,
        note: 'The provider allows 300 requests per minute per apikey per environment. The limit applies to each EA instance (each DON node), not across the DON. The adapter batches every configured security_id into one provider request per background poll, so each node can use the full provider ceiling.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
