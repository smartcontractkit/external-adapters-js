import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute, AdapterContext } from '@chainlink/types'
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
  traderRewardsAmount: false,
  marketMakerRewardsAmount: false,
  ipnsName: true,
  traderScoreAlpha: true,
  callbackAddress: true,
  newEpoch: true,
  activeRootIpfsCid: true,
}

export interface Input {
  traderRewardsAmount: bn.BigNumber
  marketMakerRewardsAmount: bn.BigNumber
  ipnsName: string
  traderScoreAlpha: number
  newEpoch: BigNumber
  activeRootIpfsCid: string
  treasuryClaimAddress: string
}

const parseAddress = (address: string): string => {
  if (address.length === 42 && address.substring(0, 2) === '0x') return address
  const buf = Buffer.from(address, 'base64')
  return `0x${buf.toString('hex').slice(-40)}`
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

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
  const traderScoreAlpha = new bn.BigNumber(validator.validated.data.traderScoreAlpha)
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
    traderScoreAlpha,
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
    calcRetroactiveRewards(epochData, addressRewards, input.treasuryClaimAddress)
  }

  calcTraderRewards(epochData, addressRewards, input.traderRewardsAmount, input.traderScoreAlpha)
  calcMarketMakerRewards(epochData, addressRewards, input.marketMakerRewardsAmount)

  if (!input.newEpoch.isZero()) {
    const previousCumulativeJsonTree = await getDataForCID(
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

// We expect the amount with 2 decimal points, and the token has 18 decimals.
const rewardAmountToBigNumber = (amount: number) =>
  BigNumber.from(amount * 100).mul(BigNumber.from(10).pow(16))

// Retroactive tiers are sorted descending to make it easier to find the highest applicable tier
const retroactiveTiers = [
  {
    min: 1_000_000,
    reward: rewardAmountToBigNumber(9529.86),
    volumeRequirement: 100_000,
  },
  {
    min: 100_000,
    reward: rewardAmountToBigNumber(6413.91),
    volumeRequirement: 50_000,
  },
  {
    min: 10_000,
    reward: rewardAmountToBigNumber(4349.63),
    volumeRequirement: 5_000,
  },
  {
    min: 1,
    reward: rewardAmountToBigNumber(1163.51),
    volumeRequirement: 500,
  },
  {
    min: 0,
    reward: rewardAmountToBigNumber(310.75),
    volumeRequirement: 1,
  },
]

// Retroactive rewards is 75M (hard-coded, as the above tiers would have to change if this was changed)
const totalRetroactiveRewards = BigNumber.from(75_000_000).mul(BigNumber.from(10).pow(18))

const findRetroactiveRewardsTier = (tradeVolume: number | boolean) => {
  // Do a strict check to avoid catching "0" - which is treated differently
  if (tradeVolume === false) {
    return {
      min: 0,
      reward: BigNumber.from(0),
      volumeRequirement: 1,
    }
  }

  const tier = retroactiveTiers.find(({ min }) => tradeVolume >= min)
  if (!tier) {
    throw new Error(`Unable to find tier for volume: ${tradeVolume}`)
  }

  return tier
}

const EXPO_BONUS_TOKENS = rewardAmountToBigNumber(565.61)

export const calcRetroactiveRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  treasuryClaimAddress: string,
) => {
  const combinedAddresses = [
    ...Object.keys(epochData.retroactiveTradeVolume || {}),
    ...Object.keys(epochData.isExpoUser || {}),
  ]
  const uniqueAddresses = [...new Set(combinedAddresses)]

  let sumRetroactivelyDistributedRewards = BigNumber.from(0)

  for (const addr of uniqueAddresses) {
    const volume = epochData.tradeVolume?.[addr] || 0
    const retroactiveVolume = epochData.retroactiveTradeVolume?.[addr] ?? false
    const tier = findRetroactiveRewardsTier(retroactiveVolume)
    const isExpoUser = epochData.isExpoUser?.[addr] || false
    const userPotentialRewardTokens = tier.reward.add(isExpoUser ? EXPO_BONUS_TOKENS : 0)
    const earnedFraction = bn.BigNumber.min(1, new bn.BigNumber(volume).div(tier.volumeRequirement))
    const userRetroactiveRewardTokens = new bn.BigNumber(userPotentialRewardTokens.toString())
      .times(earnedFraction)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (userRetroactiveRewardTokens != '0') {
      addReward(addressRewards, addr, userRetroactiveRewardTokens)
      sumRetroactivelyDistributedRewards = sumRetroactivelyDistributedRewards.add(
        userRetroactiveRewardTokens,
      )
    }
  }

  // If there are tokens not claimed (by users not reaching volume requirements), send them to the
  // treasury's merkle root claim contract.
  const totalForfeitedTokens = totalRetroactiveRewards.sub(sumRetroactivelyDistributedRewards)
  if (!totalForfeitedTokens.isZero()) {
    addReward(addressRewards, treasuryClaimAddress, totalForfeitedTokens)
  }
}

export const calcTraderRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  traderRewardsAmount: bn.BigNumber,
  traderScoreAlpha: number,
) => {
  const F = Object.keys(epochData.tradeFeesPaid).reduce(
    (sum, addr) => sum.plus(epochData.tradeFeesPaid[addr]),
    new bn.BigNumber(0),
  )
  const G = Object.keys(epochData.openInterest).reduce(
    (sum, addr) => sum.plus(epochData.openInterest[addr]),
    new bn.BigNumber(0),
  )

  const traderScore: { [address: string]: bn.BigNumber } = {}
  let traderScoreSum = new bn.BigNumber(0)

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const f = epochData.tradeFeesPaid[addr]
    const g = epochData.openInterest[addr] || 0
    const score = new bn.BigNumber((f / F.toNumber()) ** traderScoreAlpha).times(
      (g / G.toNumber()) ** (1 - traderScoreAlpha),
    )

    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
  })

  Object.keys(traderScore).forEach((addr) => {
    const reward = traderRewardsAmount
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addr, reward)
    }
  })
}

export const calcMarketMakerRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  marketMakerRewardsAmount: bn.BigNumber,
) => {
  const quoteScoreSum = Object.keys(epochData.quoteScore).reduce(
    (sum, addr) => sum.plus(epochData.quoteScore[addr]),
    new bn.BigNumber(0),
  )

  Object.keys(epochData.quoteScore).forEach((addr) => {
    const reward = marketMakerRewardsAmount
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
