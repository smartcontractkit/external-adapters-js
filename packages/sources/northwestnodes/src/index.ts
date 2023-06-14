import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { staking_ethereum_epoch_single, staking_ethereum_epoch_list } from './endpoint'

export const adapter = new Adapter({
  name: 'NORTHWESTNODES',
  endpoints: [staking_ethereum_epoch_single, staking_ethereum_epoch_list],
  defaultEndpoint: staking_ethereum_epoch_single.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
