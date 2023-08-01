import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { addresses, members } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: addresses.name,
  name: 'WBTC-ADDRESS-SET-TEST',
  config,
  endpoints: [addresses, members],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
