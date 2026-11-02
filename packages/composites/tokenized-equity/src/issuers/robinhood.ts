import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { getTokenData } from '../lib/robinhood'
import { defineIssuer, IssuerRequest } from './issuer'

const getNetwork = ({ network }: IssuerRequest): string => {
  if (!network) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing required parameter network for issuer 'robinhood'`,
    })
  }
  return network
}

// ERC-8056 uiMultiplier() / oraclePaused() on the token, on the Robinhood chain
// network from ROBINHOOD_<NETWORK>_RPC_URL and ROBINHOOD_<NETWORK>_CHAIN_ID
export const robinhood = defineIssuer({
  name: 'robinhood',
  validate: (settings, request) => {
    const network = getNetwork(request)
    settings.ROBINHOOD_NETWORK_RPC_URL.get(network)
    settings.ROBINHOOD_NETWORK_CHAIN_ID.get(network)
  },
  rpc: (settings, request) => {
    const network = getNetwork(request)
    return {
      url: settings.ROBINHOOD_NETWORK_RPC_URL.get(network),
      chainId: settings.ROBINHOOD_NETWORK_CHAIN_ID.get(network),
    }
  },
  read: (params, provider) => getTokenData(params.asset, provider),
})
