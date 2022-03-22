import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute, AdapterContext } from '@chainlink/types'
import { ExtendedConfig } from '../config'
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
import * as initial from './formulas/initial'
import * as DIP7 from './formulas/dip-7'

export const NAME = 'poke'

export const deconstructJsonTree = (data: MerkleTreeData): AddressRewards => {
  const res: AddressRewards = {}
  for (const datum of data) {
    res[datum[0]] = BigNumber.from(datum[1])
  }
  return res
}

const customParams = {
  traderRewardsAmount: false,
  marketMakerRewardsAmount: false,
  ipnsName: true,
  traderScoreAlpha: false,
  traderScoreA: false,
  traderScoreB: false,
  traderScoreC: false,
  callbackAddress: true,
  newEpoch: true,
  activeRootIpfsCid: true,
}

export interface Input {
  traderRewardsAmount: bn.BigNumber
  marketMakerRewardsAmount: bn.BigNumber
  ipnsName: string
  traderScoreA: number
  traderScoreB?: number
  traderScoreC?: number
  newEpoch: BigNumber
  activeRootIpfsCid: string
  treasuryClaimAddress: string
}

const parseAddress = (address: string): string => {
  if (address.length === 42 && address.substring(0, 2) === '0x') return address
  const buf = Buffer.from(address, 'base64')
  return `0x${buf.toString('hex').slice(-40)}`
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (input, context, config) => {
  const validator = new Validator(input, customParams)

  const jobRunID = validator.validated.jobRunID

  let traderRewardsAmount = new bn.BigNumber(config.traderRewardsAmount)
  let marketMakerRewardsAmount = new bn.BigNumber(config.marketMakerRewardsAmount)
  // Account for CBOR encoding issue
  if (
    validator.validated.data.marketMakerRewardsAmount &&
    validator.validated.data.marketMakerRewardsAmount !== 'traderRewardsAmount'
  ) {
    marketMakerRewardsAmount = new bn.BigNumber(validator.validated.data.marketMakerRewardsAmount)
  }
  if (validator.validated.data.traderRewardsAmount) {
    traderRewardsAmount = new bn.BigNumber(validator.validated.data.traderRewardsAmount)
  }

  const ipnsName = validator.validated.data.ipnsName
  const traderScoreA = new bn.BigNumber(
    config.traderScoreA ??
      validator.validated.data.traderScoreA ??
      validator.validated.data.traderScoreAlpha,
  )
    .div('1e18')
    .toNumber()
  const traderScoreB = new bn.BigNumber(
    config.traderScoreB ?? validator.validated.data.traderScoreB,
  )
    .div('1e18')
    .toNumber()
  const traderScoreC = new bn.BigNumber(
    config.traderScoreC ?? validator.validated.data.traderScoreC,
  )
    .div('1e18')
    .toNumber()
  const callbackAddress = parseAddress(validator.validated.data.callbackAddress)
  const newEpoch = BigNumber.from(validator.validated.data.newEpoch)
  const activeRootIpfsCidBase64 = Buffer.from(validator.validated.data.activeRootIpfsCid, 'base64')
  const activeRootIpfsCid = activeRootIpfsCidBase64.toString()

  const requesterContract = new ethers.Contract(callbackAddress, OracleRequester, config.wallet)

  const ipfs = IPFS.makeExecute(IPFS.makeConfig(IPFS.NAME))
  const rewardsInput: Input = {
    traderRewardsAmount,
    marketMakerRewardsAmount,
    ipnsName,
    traderScoreA,
    traderScoreB,
    traderScoreC,
    newEpoch,
    activeRootIpfsCid,
    treasuryClaimAddress: config.treasuryClaimAddress,
  }
  const addressRewards = await calculateRewards(jobRunID, rewardsInput, ipfs, context)

  const merkleTree = constructMerkleTree(addressRewards)
  const jsonTree = constructJsonTree(addressRewards)

  const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree, context)

  const tx = await requesterContract.writeOracleData(
    `0x${merkleTree.getRoot().toString('hex')}`,
    newEpoch,
    Buffer.from(newIpfsCid),
  )
  await tx.wait()

  const response = { data: { result: 1 }, status: 200 }
  return Requester.success(jobRunID, response)
}

export const calculateRewards = async (
  jobRunID: string,
  input: Input,
  ipfs: Execute,
  context: AdapterContext,
): Promise<AddressRewards> => {
  const epochData = await getDataForEpoch(
    jobRunID,
    ipfs,
    input.ipnsName,
    input.newEpoch.toNumber(),
    context,
  )

  const addressRewards: AddressRewards = {}
  if (input.newEpoch.isZero()) {
    initial.calcRetroactiveRewards(epochData, addressRewards, input.treasuryClaimAddress)
  }

  calcTraderRewards(
    epochData,
    addressRewards,
    input.traderRewardsAmount,
    input.traderScoreA,
    input.traderScoreB,
    input.traderScoreC,
  )
  calcMarketMakerRewards(epochData, addressRewards, input.marketMakerRewardsAmount)

  if (!input.newEpoch.isZero()) {
    const previousCumulativeJsonTree = await getDataForCID<MerkleTreeData>(
      jobRunID,
      ipfs,
      input.activeRootIpfsCid,
      context,
    )
    const previousAddressRewards = deconstructJsonTree(previousCumulativeJsonTree)
    calcCumulativeRewards(addressRewards, previousAddressRewards)
  }

  return addressRewards
}

export const addReward = (
  addressRewards: AddressRewards,
  address: string,
  amount: number | string | BigNumber,
): void => {
  address = ethers.utils.getAddress(address)
  if (address in addressRewards) {
    addressRewards[address] = addressRewards[address].add(amount)
  } else {
    addressRewards[address] = BigNumber.from(amount)
  }
}

export const calcTraderRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  traderRewardsAmount: bn.BigNumber,
  traderScoreA: number,
  traderScoreB?: number,
  traderScoreC?: number,
): void => {
  if (epochData.epoch < 5) {
    initial.calcTraderRewards(epochData, addressRewards, traderRewardsAmount, traderScoreA)
  } else {
    DIP7.calcTraderRewards(
      epochData,
      addressRewards,
      traderRewardsAmount,
      traderScoreA,
      traderScoreB,
      traderScoreC,
    )
  }
}

export const calcMarketMakerRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  marketMakerRewardsAmount: bn.BigNumber,
): void => initial.calcMarketMakerRewards(epochData, addressRewards, marketMakerRewardsAmount)

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
