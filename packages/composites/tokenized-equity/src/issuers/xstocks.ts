import { Contract, JsonRpcProvider, parseUnits } from 'ethers'
import ABI from '../config/XstocksWrappedBackedTokenABI.json'
import { chains } from '../lib/chains'
import { AssetRequest, Issuer, MULTIPLIER_DECIMALS, Settings } from './issuer'

/**
 * ERC-4626 style wrapper on Ethereum: the multiplier is the amount of underlying
 * asset one whole wrapped share converts to. xstocks ignores Asset Paused by GTM
 * decision (docs/adr/0002): the wrapper's pause flag is not read.
 */
export class Xstocks extends Issuer {
  readonly name = 'xstocks'

  chain(settings: Settings) {
    return chains.ethereum(settings)
  }

  async read({ asset }: AssetRequest, provider: JsonRpcProvider) {
    const token = new Contract(asset, ABI, provider)
    const multiplier = await token.convertToAssets(parseUnits('1', MULTIPLIER_DECIMALS))
    return { multiplier: BigInt(multiplier), paused: false }
  }
}

export const xstocks = new Xstocks()
