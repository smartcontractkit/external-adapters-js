import { getRegistryData } from '../lib/coinbase'
import { RegistryIssuer, Settings } from './issuer'

/** Registry `getOracleParams(asset)` on Base. */
class Coinbase extends RegistryIssuer {
  readonly name = 'coinbase'

  rpc(settings: Settings) {
    return this.fixedChainRpc(settings, 'BASE')
  }

  protected fetchFromRegistry = getRegistryData
}

export const coinbase = new Coinbase()
