import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/RobinhoodTokenABI.json'
import { chains } from '../lib/chains'
import { AssetRequest, Issuer, Settings } from './issuer'

/**
 * ERC-8056 `uiMultiplier()` and `oraclePaused()` on the token, on the Robinhood
 * chain of the requested network.
 */
export class Robinhood extends Issuer {
  readonly name = 'robinhood'

  chain(settings: Settings, { network }: AssetRequest) {
    if (!network) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing required parameter network for issuer '${this.name}'`,
      })
    }
    return chains.robinhood(settings, network)
  }

  async read({ asset }: AssetRequest, provider: JsonRpcProvider) {
    const token = new Contract(asset, ABI, provider)
    const [multiplier, paused] = await Promise.all([token.uiMultiplier(), token.oraclePaused()])
    return { multiplier: BigInt(multiplier), paused: Boolean(paused) }
  }
}

export const robinhood = new Robinhood()
