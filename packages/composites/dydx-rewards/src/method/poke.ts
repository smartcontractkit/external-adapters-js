import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import { OracleRequester } from '../contracts'
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
import * as bn from 'bignumber.js'

export const NAME = 'poke'

export const deconstructJsonTree = (data: MerkleTreeData): AddressRewards => {
  const res: AddressRewards = {}
  for (const datum of data) {
    res[datum[0]] = BigNumber.from(datum[1])
  }
  return res
}

const customParams = {
  traderRewardsAmount: true,
  marketMakerRewardsAmount: true,
  ipnsName: true,
  traderScoreAlpha: true,
  callbackAddress: true,
  newEpoch: true,
  activeRootIpfsCid: true,
}

export interface Input {
  traderRewardsAmount: number
  marketMakerRewardsAmount: number
  ipnsName: string
  traderScoreAlpha: number
  newEpoch: BigNumber
  activeRootIpfsCid: string
}

const parseAddress = (address: string): string => {
  if (address.length === 42 && address.substring(0, 2) === '0x') return address
  const buf = Buffer.from(address, 'base64')
  return `0x${buf.toString('hex').slice(-40)}`
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const traderRewardsAmount = validator.validated.data.traderRewardsAmount
  const marketMakerRewardsAmount = validator.validated.data.marketMakerRewardsAmount
  const ipnsName = validator.validated.data.ipnsName
  const traderScoreAlpha = new bn.BigNumber(validator.validated.data.traderScoreAlpha)
    .div('1e18')
    .toNumber()
  const callbackAddress = parseAddress(validator.validated.data.callbackAddress)
  const newEpoch = BigNumber.from(validator.validated.data.newEpoch)
  const activeRootIpfsCid = validator.validated.data.activeRootIpfsCid

  const requesterContract = new ethers.Contract(callbackAddress, OracleRequester, config.wallet)

  const ipfs = IPFS.makeExecute(IPFS.makeConfig(IPFS.NAME))
  const rewardsInput: Input = {
    traderRewardsAmount,
    marketMakerRewardsAmount,
    ipnsName,
    traderScoreAlpha,
    newEpoch,
    activeRootIpfsCid,
  }
  const addressRewards = await calculateRewards(jobRunID, rewardsInput, ipfs)

  const merkleTree = constructMerkleTree(addressRewards)
  const jsonTree = constructJsonTree(addressRewards)

  const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree)

  const tx = await requesterContract.writeOracleData(
    `0x${merkleTree.getRoot().toString('hex')}`,
    Buffer.from(newIpfsCid),
    newEpoch,
  )
  await tx.wait()

  const response = { data: { result: 1 }, status: 200 }
  return Requester.success(jobRunID, response)
}

export const calculateRewards = async (
  jobRunID: string,
  input: Input,
  ipfs: Execute,
): Promise<AddressRewards> => {
  const epochData = await getDataForEpoch(jobRunID, ipfs, input.ipnsName, input.newEpoch.toNumber())

  const addressRewards: AddressRewards = {}
  if (input.newEpoch.isZero()) {
    calcRetroactiveRewards(epochData, addressRewards)
  }

  calcTraderRewards(epochData, addressRewards, input.traderRewardsAmount, input.traderScoreAlpha)
  calcMarketMakerRewards(epochData, addressRewards, input.marketMakerRewardsAmount)

  if (!input.newEpoch.isZero()) {
    const previousCumulativeJsonTree = await getDataForCID(jobRunID, ipfs, input.activeRootIpfsCid)
    const previousAddressRewards = deconstructJsonTree(previousCumulativeJsonTree)
    calcCumulativeRewards(addressRewards, previousAddressRewards)
  }

  return addressRewards
}

const addReward = (
  addressRewards: AddressRewards,
  address: string,
  amount: number | string | BigNumber,
) => {
  address = ethers.utils.getAddress(address)
  if (address in addressRewards) {
    addressRewards[address] = addressRewards[address].add(amount)
  } else {
    addressRewards[address] = BigNumber.from(amount)
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
    (sum, addr) => sum.plus(epochData.tradeFeesPaid[addr]),
    new bn.BigNumber(0),
  )
  const G = Object.keys(epochData.averageOpenInterest).reduce(
    (sum, addr) => sum.plus(epochData.averageOpenInterest[addr]),
    new bn.BigNumber(0),
  )

  const traderScore: { [address: string]: bn.BigNumber } = {}
  let traderScoreSum = new bn.BigNumber(0)

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const f = epochData.tradeFeesPaid[addr]
    const g = epochData.averageOpenInterest[addr] || 0
    const score = new bn.BigNumber((f / F.toNumber()) ** traderScoreAlpha).times(
      (g / G.toNumber()) ** (1 - traderScoreAlpha),
    )

    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
  })

  Object.keys(traderScore).forEach((addr) => {
    const reward = new bn.BigNumber(traderRewardsAmount)
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addr, reward)
    }
  })
}

const calcMarketMakerRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  marketMakerRewardsAmount: number,
) => {
  const quoteScoreSum = Object.keys(epochData.quoteScore).reduce(
    (sum, addr) => sum.plus(epochData.quoteScore[addr]),
    new bn.BigNumber(0),
  )

  Object.keys(epochData.quoteScore).forEach((addr) => {
    const reward = new bn.BigNumber(marketMakerRewardsAmount)
      .times(epochData.quoteScore[addr])
      .div(quoteScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addr, reward)
    }
  })
}

const calcCumulativeRewards = (addressRewards: AddressRewards, previousRewards: AddressRewards) => {
  Object.keys(previousRewards).forEach((addr) => {
    addReward(addressRewards, addr, previousRewards[addr])
  })
}

export const keccakReward = (address: string, reward: BigNumber): Buffer =>
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
