import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'
import { SharePriceType, getNetworkEnvVar } from './utils'

export const getRate = async (
  contractAddress: string,
  provider?: ethers.JsonRpcProvider,
): Promise<SharePriceType> => {
  if (!provider) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'ARBITRUM_RPC_URL is missing',
    })
  }

  const contract = new ethers.Contract(contractAddress, EACAggregatorProxy, provider)
  const [decimal, value]: [bigint, bigint] = await Promise.all([
    contract.decimals(),
    contract.latestAnswer(),
  ])

  return {
    value,
    decimal: Number(decimal),
  }
}

export const getTokenPrice = ({
  priceOracleAddress,
  priceOracleNetwork,
}: {
  priceOracleAddress: string
  priceOracleNetwork: string
}): Promise<SharePriceType> => {
  const provider = getEvmProvider(priceOracleNetwork)
  return getRate(priceOracleAddress, provider)
}

export const getEvmProvider = (network: string): ethers.JsonRpcProvider => {
  const rpcUrl = getNetworkEnvVar(network, '_RPC_URL')
  const chainId = getNetworkEnvVar(network, '_RPC_CHAIN_ID')
  return new ethers.JsonRpcProvider(rpcUrl, Number(chainId))
}
