import { Contract, JsonRpcProvider, parseUnits } from 'ethers'
import ABI from '../config/XstocksWrappedBackedTokenABI.json'
import { chains } from '../lib/chains'
import { AssetRequest, Issuer, MULTIPLIER_DECIMALS, Settings } from './issuer'

/**
 * ERC-4626 style wrapper on Ethereum: the multiplier is the amount of underlying
 * asset one whole wrapped share converts to.
 */
export class Xstocks extends Issuer {
  readonly name = 'xstocks'

  chain(settings: Settings) {
    return chains.ethereum(settings)
  }

  async read({ asset }: AssetRequest, provider: JsonRpcProvider) {
    const token = new Contract(asset, ABI, provider)
    const [multiplier, paused] = await Promise.all([
      token.convertToAssets(parseUnits('1', MULTIPLIER_DECIMALS)),
      token.isPaused(),
    ])
    return { multiplier: BigInt(multiplier), paused: Boolean(paused) }
  }
}

export const xstocks = new Xstocks()
