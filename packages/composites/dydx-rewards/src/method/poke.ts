import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import { ethers } from 'ethers'
import { MerkleDistributorV1 } from '../contracts'
import {
  AddressRewards,
  getDataForCID,
  getDataForEpoch,
  MerkleTreeData,
  OracleRewardsData,
  storeJsonTree,
} from '../ipfs-data'
import * as IPFS from '@chainlink/ipfs-adapter'
import { MerkleTree } from 'merkletreejs'

export const NAME = 'poke'

const customParams = {
  traderRewardsAmount: true,
  marketMakerRewardsAmount: true,
  ipnsName: true,
  traderScoreAlpha: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const traderRewardsAmount = validator.validated.data.traderRewardsAmount
  const marketMakerRewardsAmount = validator.validated.data.marketMakerRewardsAmount
  const ipnsName = validator.validated.data.ipnsName
  const traderScoreAlpha = validator.validated.data.traderScoreAlpha

  const merkleDistributor = new ethers.Contract(
    config.distributorAddress,
    MerkleDistributorV1,
    config.wallet,
  )
  const { merkleRoot, ipfsCid, epoch } = (await merkleDistributor.getActiveRoot()) as {
    merkleRoot: string
    ipfsCid: string
    epoch: ethers.BigNumber
  }

  let newEpoch = epoch.add(1)
  if (merkleRoot == ethers.constants.HashZero) {
    newEpoch = ethers.BigNumber.from(0)
  }

  const ipfs = IPFS.makeExecute(IPFS.makeConfig(IPFS.NAME))

  const epochData = await getDataForEpoch(jobRunID, ipfs, ipnsName, newEpoch.toNumber())

  const addressRewards: AddressRewards = {}
  if (newEpoch.isZero()) {
    calcRetroactiveRewards(epochData, addressRewards)
  }
  calcTraderRewards(epochData, addressRewards, traderRewardsAmount, traderScoreAlpha)
  calcMarketMakerRewards(epochData, addressRewards, marketMakerRewardsAmount)
  if (!newEpoch.isZero()) {
    const cid = ethers.utils.parseBytes32String(ipfsCid)
    const previousAddressRewards = (await getDataForCID(jobRunID, ipfs, cid)) as AddressRewards
    calcCumulativeRewards(addressRewards, previousAddressRewards)
  }

  const merkleTree = constructMerkleTree(addressRewards)
  const jsonTree = constructJsonTree(addressRewards)

  const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree)

  await merkleDistributor.proposeNewRoot(merkleTree.getRoot().toString('hex'), newIpfsCid, newEpoch)

  const response = { data: { result: 1 }, status: 200 }
  return Requester.success(jobRunID, response)
}

const addReward = (
  addressRewards: AddressRewards,
  address: string,
  amount: number | ethers.BigNumber,
) => {
  address = ethers.utils.getAddress(address)
  if (address in addressRewards) {
    addressRewards[address] = addressRewards[address].add(amount)
  } else {
    addressRewards[address] = ethers.BigNumber.from(amount)
  }
}

const calcRetroactiveRewards = (epochData: OracleRewardsData, addressRewards: AddressRewards) => {
  // TODO: TBD by dYdX closer to launch
  console.log(epochData)
  console.log(addressRewards)
}

const calcTraderRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  traderRewardsAmount: number,
  traderScoreAlpha: number,
) => {
  const F = Object.keys(epochData.tradeFeesPaid).reduce(
    (sum, addr) => sum + epochData.tradeFeesPaid[addr],
    0,
  )
  const G = Object.keys(epochData.averageOpenInterest).reduce(
    (sum, addr) => sum + epochData.averageOpenInterest[addr],
    0,
  )
  const R = traderRewardsAmount
  const a = traderScoreAlpha

  const traderScore: { [address: string]: number } = {}
  let traderScoreSum = 0

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const f = epochData.tradeFeesPaid[addr]
    const g = epochData.averageOpenInterest[addr] || 0
    const score = R * Math.pow(f / F, a) * Math.pow(g / G, 1 - a)
    traderScore[addr] = score
    traderScoreSum += score
  })

  Object.keys(traderScore).forEach((addr) => {
    addReward(addressRewards, addr, Math.floor((R * traderScore[addr]) / traderScoreSum))
  })
}

const calcMarketMakerRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  marketMakerRewardsAmount: number,
) => {
  const quoteScoreSum = Object.keys(epochData.quoteScore).reduce(
    (sum, addr) => sum + epochData.quoteScore[addr],
    0,
  )

  Object.keys(epochData.quoteScore).forEach((addr) => {
    addReward(
      addressRewards,
      addr,
      Math.floor((marketMakerRewardsAmount * epochData.quoteScore[addr]) / quoteScoreSum),
    )
  })
}

const calcCumulativeRewards = (addressRewards: AddressRewards, previousRewards: AddressRewards) => {
  Object.keys(previousRewards).forEach((addr) => {
    addReward(addressRewards, addr, previousRewards[addr])
  })
}

export const keccakReward = (address: string, reward: ethers.BigNumber): Buffer =>
  Buffer.from(
    ethers.utils
      .solidityKeccak256(['address', 'uint256'], [ethers.utils.getAddress(address), reward])
      .substr(2),
    'hex',
  )

export const hashFn = (value: Buffer): Buffer =>
  Buffer.from(ethers.utils.keccak256(value).substr(2), 'hex')

export const constructMerkleTree = (addressRewards: AddressRewards): MerkleTree => {
  const leaves = Object.keys(addressRewards).map((addr) => keccakReward(addr, addressRewards[addr]))
  const options = {
    sort: true,
  }
  return new MerkleTree(leaves, hashFn, options)
}

export const constructJsonTree = (addressRewards: AddressRewards): MerkleTreeData =>
  Object.keys(addressRewards)
    .sort((a, b) =>
      Buffer.compare(keccakReward(a, addressRewards[a]), keccakReward(b, addressRewards[b])),
    )
    .map((addr) => [addr, addressRewards[addr].toString()])
