import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/SyntheticSharesOracleABI.json'
import { chains } from '../lib/chains'
import { AssetRequest, Issuer, Settings } from './issuer'

/** Registry `getSValue(asset)` on Ethereum. */
export class Ondo extends Issuer {
  readonly name = 'ondo'

  chain(settings: Settings) {
    return chains.ethereum(settings)
  }

  override validate(settings: Settings, request: AssetRequest) {
    this.registry(request)
    super.validate(settings, request)
  }

  async read(request: AssetRequest, provider: JsonRpcProvider) {
    const registry = new Contract(this.registry(request), ABI, provider)
    const { sValue, paused } = await registry.getSValue(request.asset)
    return { multiplier: BigInt(sValue), paused: Boolean(paused) }
  }
}

export const ondo = new Ondo()
