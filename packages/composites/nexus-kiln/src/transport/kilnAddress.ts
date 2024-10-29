import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ethers } from 'ethers'

interface ValidatorIdsResponse {
  data: {
    kilnStakingPositions: {
      id: string
      validators: {
        id: string
      }[]
    }[]
  }
}

const getValidatorIds = async (
  nexusVaultContract: string,
  graphqlEndpoint: string,
  requester: Requester,
): Promise<string[]> => {
  const query = `
  {
    kilnStakingPositions(
        where: { vault: "${nexusVaultContract}" }
        first: 1000
    ) {
        id
        validators(first: 1000) {
            id
        }
    }
  }`
  const requestConfig = {
    url: graphqlEndpoint,
    method: 'POST',
    data: { query },
  }

  const sourceResponse = await requester.request<ValidatorIdsResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return sourceResponse.response.data.data.kilnStakingPositions
    .map((p) => p.validators.map((v) => v.id))
    .flat()
}

export const getFeeRecipients = async (
  nexusVaultContract: string,
  graphqlEndpoint: string,
  contract: ethers.Contract,
  requester: Requester,
): Promise<string[]> => {
  const validatorIds = await getValidatorIds(nexusVaultContract, graphqlEndpoint, requester)

  const feeRecipients = await Promise.all(
    validatorIds.flatMap((id) => [contract.getELFeeRecipient(id), contract.getCLFeeRecipient(id)]),
  )

  return feeRecipients.map((f) => f.toString()).sort()
}
