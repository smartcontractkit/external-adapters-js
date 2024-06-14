import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { staking_ethereum_epoch_single, staking_ethereum_epoch_list } from './endpoint'

export const adapter = new Adapter({
  name: 'NORTHWESTNODES',
  endpoints: [staking_ethereum_epoch_single, staking_ethereum_epoch_list],
  defaultEndpoint: staking_ethereum_epoch_single.name,
  config,
  rateLimiting: {
    tiers: {
      staking_ethereum_apr_chainlink_nop: {
        rateLimit1s: 1,
        rateLimit1m: 10,
        rateLimit1h: 60,
        note: 'Default Chainlink NOP rate limiting tier for the Ethereum staking APR data',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
