import { getRegistryData } from '../lib/registry'
import { defineIssuer, ethereumRpc, getRegistry, requireRegistry, requireRpcUrl } from './issuer'

// Registry getSValue(asset) on Ethereum
export const ondo = defineIssuer({
  name: 'ondo',
  validate: (settings, request) => {
    requireRegistry('ondo', request)
    requireRpcUrl(settings, 'ETHEREUM_RPC_URL')
  },
  rpc: ethereumRpc,
  read: async (params, provider) =>
    getRegistryData(params.asset, getRegistry('ondo', params), provider),
})
