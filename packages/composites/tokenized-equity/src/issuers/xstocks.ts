import { JsonRpcProvider } from 'ethers'
import { getTokenData } from '../lib/xstocks'
import { Issuer, IssuerRequest, Settings } from './issuer'

/**
 * ERC-4626 style wrapper on Ethereum: the multiplier is the amount of underlying
 * asset for one whole wrapped share.
 */
class Xstocks extends Issuer {
  readonly name = 'xstocks'

  rpc(settings: Settings) {
    return this.fixedChainRpc(settings, 'ETHEREUM')
  }

  protected fetch({ asset }: IssuerRequest, provider: JsonRpcProvider) {
    return getTokenData(asset, provider)
  }
}

export const xstocks = new Xstocks()
