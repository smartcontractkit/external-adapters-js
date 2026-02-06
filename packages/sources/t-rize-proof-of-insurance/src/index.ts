import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { insuranceProof } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: insuranceProof.name,
  name: 'T_RIZE_PROOF_OF_INSURANCE',
  config,
  endpoints: [insuranceProof],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 5,
        note: 'T-Rize API rate limit: 5 requests per second',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
