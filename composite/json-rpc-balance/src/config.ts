import { util } from '@chainlink/ea-bootstrap'
import { getAddressBalanceImpl } from './nodes'
import * as jsonRpc from '@chainlink/json-rpc-adapter'
import { balance } from '@chainlink/ea-factories'

export const ENV_NODE_TYPE = 'NODE_TYPE'
export const ENV_CHAIN = 'CHAIN'
export const ENV_COIN = 'COIN'

export const makeConfig = (prefix = ''): balance.BalanceConfig => {
  const type = util.getRequiredEnv(ENV_NODE_TYPE, prefix)
  const chain = util.getEnv(ENV_CHAIN, prefix) || 'mainnet'
  const coin = util.getEnv(ENV_COIN, prefix) || 'btc'

  const jsonRpcAdapter = jsonRpc.makeExecute(jsonRpc.makeConfig(prefix))
  const getBalance = getAddressBalanceImpl(type, jsonRpcAdapter)

  return {
    api: {},
    getBalance,
    isSupported: (rCoin, rChain) => rCoin === coin && rChain === chain,
  }
}
