import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { balance, totalBalance } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: balance.name,
  name: 'AVALANCHE_PLATFORM',
  config,
  // TODO: The 'balance' endpoint seems to be unused. Delete it after
  //       confirming that it's not needed anymore.
  endpoints: [balance, totalBalance],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
