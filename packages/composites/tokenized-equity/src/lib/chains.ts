import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { config } from '../config'

type Settings = typeof config.settings

/** A chain this adapter reads from, as configured in its settings. */
export type Chain = {
  name: string
  rpcUrl: string
  chainId: number
}

// Ethereum and Base are optional settings, so a deployment may not reach them.
// Fails like a missing required setting does.
const fixedChain = (settings: Settings, prefix: 'ETHEREUM' | 'BASE'): Chain => {
  const rpcUrl = settings[`${prefix}_RPC_URL`]
  if (!rpcUrl) {
    throw new AdapterError({
      statusCode: 500,
      message: `Missing required environment variable: ${prefix}_RPC_URL`,
    })
  }
  return { name: prefix.toLowerCase(), rpcUrl, chainId: settings[`${prefix}_RPC_CHAIN_ID`] }
}

export const chains = {
  ethereum: (settings: Settings) => fixedChain(settings, 'ETHEREUM'),
  base: (settings: Settings) => fixedChain(settings, 'BASE'),
  /** Robinhood runs one chain per network, set by `ROBINHOOD_<NETWORK>_RPC_URL` and `_CHAIN_ID`. */
  robinhood: (settings: Settings, network: string): Chain => ({
    name: `robinhood-${network}`,
    rpcUrl: settings.ROBINHOOD_NETWORK_RPC_URL.get(network),
    chainId: settings.ROBINHOOD_NETWORK_CHAIN_ID.get(network),
  }),
}

/** One provider per chain, shared by every request that reads from it. */
export class ChainProviders {
  private readonly providers = new Map<string, JsonRpcProvider>()

  get({ name, rpcUrl, chainId }: Chain): JsonRpcProvider {
    let provider = this.providers.get(name)
    if (!provider) {
      provider = new JsonRpcProvider(rpcUrl, chainId)
      this.providers.set(name, provider)
    }
    return provider
  }
}
