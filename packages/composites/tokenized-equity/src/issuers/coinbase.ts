import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/CoinbaseOracleRegistryABI.json'
import { chains } from '../lib/chains'
import { AssetRequest, Issuer, Settings } from './issuer'

/** Registry `getOracleParams(asset)` on Base. */
export class Coinbase extends Issuer {
  readonly name = 'coinbase'

  chain(settings: Settings) {
    return chains.base(settings)
  }

  override validate(settings: Settings, request: AssetRequest) {
    this.registry(request)
    super.validate(settings, request)
  }

  async read(request: AssetRequest, provider: JsonRpcProvider) {
    const registry = new Contract(this.registry(request), ABI, provider)
    const { multiplier, paused } = await registry.getOracleParams(request.asset)
    return { multiplier: BigInt(multiplier), paused: Boolean(paused) }
  }
}

export const coinbase = new Coinbase()
