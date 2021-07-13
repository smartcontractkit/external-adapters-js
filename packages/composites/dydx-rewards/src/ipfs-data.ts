import { CID } from 'ipfs'
import { Execute } from '@chainlink/types'
import { BigNumber } from 'ethers'

export interface AddressRewards {
  [address: string]: BigNumber
}

export type MerkleTreeData = [string, string][]

export interface OracleRewardsDataByEpoch {
  latestEpoch: number
  dataByEpoch: {
    [epoch: number]: typeof CID
  }
}

export interface OracleRewardsData {
  epoch: number
  tradeFeesPaid: {
    [address: string]: number
  }
  averageOpenInterest: {
    [address: string]: number
  }
  quoteScore: {
    [address: string]: number
  }
}

export const getDataFromIPNS = async (jobRunID: string, ipfs: Execute, ipnsName: string) => {
  const params = { id: jobRunID, data: { method: 'read', ipns: ipnsName, type: 'dag' } }
  const response = await ipfs(params)
  return response.result as OracleRewardsDataByEpoch
}

export const getDataForCID = async (jobRunID: string, ipfs: Execute, cid: string) => {
  const params = { id: jobRunID, data: { method: 'read', cid, codec: 'json' } }
  const response = await ipfs(params)
  return response.result
}

export const getDataForEpoch = async (
  jobRunID: string,
  ipfs: Execute,
  ipnsName: string,
  epoch: number,
): Promise<OracleRewardsData> => {
  const oracleRewardsDataByEpoch = await getDataFromIPNS(jobRunID, ipfs, ipnsName)
  if (!(epoch in oracleRewardsDataByEpoch.dataByEpoch)) {
    throw Error(`Epoch ${epoch} was not found in OracleRewardsDataByEpoch`)
  }
  return getDataForCID(jobRunID, ipfs, oracleRewardsDataByEpoch.dataByEpoch[epoch].toV1())
}

export const storeJsonTree = async (jobRunID: string, ipfs: Execute, data: MerkleTreeData) => {
  const params = { id: jobRunID, data: { method: 'write', data, codec: 'json', cidVersion: 1 } }
  const response = await ipfs(params)
  return response.result
}
