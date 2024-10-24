import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ethers } from 'ethers'
import StakingContract from '../abi/StakingContract.json'
import { getFeeRecipients } from './kilnAddress'

interface ETHBalanceResponse {
  data: {
    result: {
      address: string
      balance: string
    }[]
  }
}

const getTotalYields = async (
  nexusVaultContract: string,
  minConfirmations: number,
  graphqlEndpoint: string,
  ethBalanceAdapterUrl: string,
  contract: ethers.Contract,
  requester: Requester,
): Promise<bigint> => {
  const feeRecipients = await getFeeRecipients(
    nexusVaultContract,
    graphqlEndpoint,
    contract,
    requester,
  )

  const requestConfig = {
    url: ethBalanceAdapterUrl,
    method: 'POST',
    data: {
      data: {
        addresses: feeRecipients.map((f) => ({ address: f })),
        minConfirmations,
      },
    },
  }

  const sourceResponse = await requester.request<ETHBalanceResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return sourceResponse.response.data.data.result
    .map((r) => BigInt(r.balance))
    .reduce((sum, element) => sum + element)
}

const getKilnFee = async (contract: ethers.Contract): Promise<bigint> => {
  return BigInt(await contract.getGlobalFee())
}

export const getKilnStakingYields = async (
  nexusVaultContract: string,
  kilnStakingContract: string,
  minConfirmations: number,
  graphqlEndpoint: string,
  ethBalanceAdapterUrl: string,
  requester: Requester,
  provider: ethers.JsonRpcProvider,
): Promise<bigint> => {
  const contract = new ethers.Contract(kilnStakingContract, StakingContract, provider)

  const [totalYields, kilnFee] = await Promise.all([
    getTotalYields(
      nexusVaultContract,
      minConfirmations,
      graphqlEndpoint,
      ethBalanceAdapterUrl,
      contract,
      requester,
    ),
    getKilnFee(contract),
  ])

  return (totalYields * (10000n - kilnFee)) / 10000n
}
