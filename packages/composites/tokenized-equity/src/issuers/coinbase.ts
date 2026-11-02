import { getRegistryData } from '../lib/coinbase'
import { baseRpc, defineIssuer, getRegistry, requireRegistry, requireRpcUrl } from './issuer'

// Registry getOracleParams(asset) on Base
export const coinbase = defineIssuer({
  name: 'coinbase',
  validate: (settings, request) => {
    requireRegistry('coinbase', request)
    requireRpcUrl(settings, 'BASE_RPC_URL')
  },
  rpc: baseRpc,
  read: async (params, provider) =>
    getRegistryData(params.asset, getRegistry('coinbase', params), provider),
})
