import { getRegistryData } from '../lib/registry'
import { RegistryIssuer, Settings } from './issuer'

/** Registry `getSValue(asset)` on Ethereum. */
class Ondo extends RegistryIssuer {
  readonly name = 'ondo'

  rpc(settings: Settings) {
    return this.fixedChainRpc(settings, 'ETHEREUM')
  }

  protected fetchFromRegistry = getRegistryData
}

export const ondo = new Ondo()
