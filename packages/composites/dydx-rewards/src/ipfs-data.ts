import { Execute, AdapterContext } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import { types } from '@chainlink/ipfs-adapter'

export interface AddressRewards {
  [address: string]: BigNumber
}

export type MerkleTreeData = [string, string][]

export interface OracleRewardsDataByEpoch {
  latestEpoch: number
  dataByEpoch: {
    [epoch: number]: types.read.CID
  }
}

export interface OracleRewardsData {
  epoch: number
  retroactiveTradeVolume?: {
    [address: string]: number
  }
  tradeVolume?: {
    [address: string]: number
  }
  isExpoUser?: {
    [address: string]: boolean
  }
  tradeFeesPaid: {
    [address: string]: number
  }
  openInterest: {
    [address: string]: number
  }
  averageActiveStakedDYDX?: {
    [address: string]: number
  }
  quoteScore: {
    [address: string]: number
  }
  linkedPrimaryAddresses?: {
    [address: string]: string
  }
}

export const getDataFromIPNS = async <T>(
  jobRunID: string,
  ipfs: Execute,
  ipnsName: string,
  context: AdapterContext,
): Promise<T> => {
  const params = { id: jobRunID, data: { endpoint: 'read', ipns: ipnsName, type: 'dag' } }
  const response = await ipfs(params, context)
  return response.result as unknown as T
  // TODO: makeExecute return types
}

export const getDataForCID = async <T>(
  jobRunID: string,
  ipfs: Execute,
  cid: types.read.IPFSPath,
  context: AdapterContext,
): Promise<T> => {
  const params = { id: jobRunID, data: { endpoint: 'read', cid, codec: 'json' } }
  const response = await ipfs(params as any, context)
  return response.result as unknown as T
  // TODO: makeExecute return types
}

export const getDataForEpoch = async (
  jobRunID: string,
  ipfs: Execute,
  ipnsName: string,
  epoch: number,
  context: AdapterContext,
): Promise<OracleRewardsData> => {
  const oracleRewardsDataByEpoch = await getDataFromIPNS<OracleRewardsDataByEpoch>(
    jobRunID,
    ipfs,
    ipnsName,
    context,
  )
  if (!(epoch in oracleRewardsDataByEpoch.dataByEpoch)) {
    throw Error(`Epoch ${epoch} was not found in OracleRewardsDataByEpoch`)
  }
  return getDataForCID(jobRunID, ipfs, oracleRewardsDataByEpoch.dataByEpoch[epoch].toV1(), context)
}

export const storeJsonTree = async (
  jobRunID: string,
  ipfs: Execute,
  data: MerkleTreeData,
  context: AdapterContext,
): Promise<string> => {
  const params = { id: jobRunID, data: { endpoint: 'write', data, codec: 'json', cidVersion: 1 } }
  const response = await ipfs(params as any, context)
  return response.result as unknown as string
  // TODO: makeExecute return types
}
