import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { getTokenData } from '../lib/robinhood'
import { Issuer, IssuerRequest, Settings } from './issuer'

/**
 * ERC-8056 `uiMultiplier()` / `oraclePaused()` on the token, on the Robinhood chain
 * network from `ROBINHOOD_<NETWORK>_RPC_URL` and `ROBINHOOD_<NETWORK>_CHAIN_ID`.
 */
class Robinhood extends Issuer {
  readonly name = 'robinhood'

  rpc(settings: Settings, { network }: IssuerRequest) {
    if (!network) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing required parameter network for issuer '${this.name}'`,
      })
    }
    return {
      url: settings.ROBINHOOD_NETWORK_RPC_URL.get(network),
      chainId: settings.ROBINHOOD_NETWORK_CHAIN_ID.get(network),
    }
  }

  protected fetch({ asset }: IssuerRequest, provider: JsonRpcProvider) {
    return getTokenData(asset, provider)
  }
}

export const robinhood = new Robinhood()
