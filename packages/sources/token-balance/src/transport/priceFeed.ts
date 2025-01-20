import { ethers } from 'ethers'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'

export const getRate = async (contractAddress: string, provider?: ethers.JsonRpcProvider) => {
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
