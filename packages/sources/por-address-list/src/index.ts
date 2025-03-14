import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import {
  address,
  solvBTC,
  bedrockBTC,
  coinbaseBTC,
  multichainAddress,
  openedenAddress,
} from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: address.name,
  name: 'POR_ADDRESS_LIST',
  config,
  endpoints: [address, solvBTC, bedrockBTC, coinbaseBTC, multichainAddress, openedenAddress],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 1,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
