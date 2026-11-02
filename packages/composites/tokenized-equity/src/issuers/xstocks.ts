import { Contract, parseUnits } from 'ethers'
import ABI from '../config/XstocksWrappedBackedTokenABI.json'
import { defineIssuer, ethereumRpc, MULTIPLIER_DECIMALS, requireRpcUrl } from './issuer'

const ONE_SHARE = parseUnits('1', MULTIPLIER_DECIMALS)

// ERC-4626 style wrapper on Ethereum: the multiplier is the amount of underlying asset for
// one whole wrapped share
export const xstocks = defineIssuer({
  name: 'xstocks',
  validate: (settings) => requireRpcUrl(settings, 'ETHEREUM_RPC_URL'),
  rpc: ethereumRpc,
  read: async (params, provider) => {
    const wrapper = new Contract(params.asset, ABI, provider)
    const [multiplier, paused] = await Promise.all([
      wrapper.convertToAssets(ONE_SHARE),
      wrapper.isPaused(),
    ])
    return { multiplier: BigInt(multiplier), paused: Boolean(paused) }
  },
})
