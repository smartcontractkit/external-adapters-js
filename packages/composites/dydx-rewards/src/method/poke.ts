import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import { MerkleDistributorV1, OracleRequester } from '../contracts'
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

const customParams = {
  traderRewardsAmount: true,
  marketMakerRewardsAmount: true,
  ipnsName: true,
  traderScoreAlpha: true,
  callbackAddress: true,
}

export interface Input {
  traderRewardsAmount: number
  marketMakerRewardsAmount: number
  ipnsName: string
  traderScoreAlpha: number
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const traderRewardsAmount = validator.validated.data.traderRewardsAmount
  const marketMakerRewardsAmount = validator.validated.data.marketMakerRewardsAmount
  const ipnsName = validator.validated.data.ipnsName
  const traderScoreAlpha = validator.validated.data.traderScoreAlpha
  const callbackAddress = validator.validated.data.callbackAddress

  const requesterContract = new ethers.Contract(callbackAddress, OracleRequester, config.wallet)
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

  const ipfs = IPFS.makeExecute(IPFS.makeConfig(IPFS.NAME))
  const rewardsInput: Input = {
    traderRewardsAmount,
    marketMakerRewardsAmount,
    ipnsName,
    traderScoreAlpha,
  }
  const { addressRewards, newEpoch } = await calculateRewards(
    jobRunID,
    rewardsInput,
    merkleRoot,
    ipfsCid,
    epoch,
    ipfs,
  )

  const merkleTree = constructMerkleTree(addressRewards)
  const jsonTree = constructJsonTree(addressRewards)

  const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree)

  const tx = await requesterContract.writeOracleData(
    '0x' + merkleTree.getRoot().toString('hex'),
    newIpfsCid,
    newEpoch,
  )
  await tx.wait()

  const response = { data: { result: 1 }, status: 200 }
  return Requester.success(jobRunID, response)
}

export const calculateRewards = async (
  jobRunID: string,
  input: Input,
  merkleRoot: string,
  ipfsCid: string,
  epoch: BigNumber,
  ipfs: Execute,
): Promise<{ addressRewards: AddressRewards; newEpoch: BigNumber }> => {
  let newEpoch = epoch.add(1)
  if (merkleRoot == ethers.constants.HashZero) {
    newEpoch = BigNumber.from(0)
  }

  const epochData = await getDataForEpoch(jobRunID, ipfs, input.ipnsName, newEpoch.toNumber())

  const addressRewards: AddressRewards = {}
  if (newEpoch.isZero()) {
    calcRetroactiveRewards(epochData, addressRewards)
  }

  calcTraderRewards(epochData, addressRewards, input.traderRewardsAmount, input.traderScoreAlpha)
  calcMarketMakerRewards(epochData, addressRewards, input.marketMakerRewardsAmount)

  if (!newEpoch.isZero()) {
    const cid = ethers.utils.parseBytes32String(ipfsCid)
    const previousAddressRewards = (await getDataForCID(jobRunID, ipfs, cid)) as AddressRewards
    calcCumulativeRewards(addressRewards, previousAddressRewards)
  }

  return { addressRewards, newEpoch }
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
  //const R = new Decimal(traderRewardsAmount)
  //const a = traderScoreAlpha

  const traderScore: { [address: string]: bn.BigNumber } = {}
  let traderScoreSum = new bn.BigNumber(0)

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const f = epochData.tradeFeesPaid[addr]
    const g = epochData.averageOpenInterest[addr] || 0
    // const score = R * (Math.pow(f / F, a)) * (Math.pow(g / G, 1 - a))
    //const score = new Decimal((f / F.toNumber()) ** a)
    //  .mul((g / G.toNumber()) ** (1 - a))
    // const score = R.mul(f.div(F).pow(a)).mul(g.div(G).pow(new Decimal(1).sub(a)))
    const score = new bn.BigNumber((f / F.toNumber()) ** traderScoreAlpha).times(
      (g / G.toNumber()) ** (1 - traderScoreAlpha),
    )
    /*const score = new Decimal(new Decimal(f).div(F).pow(traderScoreAlpha))
      .times(new Decimal(g).div(G).pow(1 - traderScoreAlpha))
      .round()*/

    //const score = ((new Decimal(f).div(F)).pow(a)).mul((new Decimal(g).div(G)).pow(1-a))

    console.log('score', score)
    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
  })

  Object.keys(traderScore).forEach((addr) => {
    // if (traderScore[addr].isZero()) return

    // addReward(addressRewards, addr, Math.floor(R * traderScore[addr] / traderScoreSum))
    // const dec = Decimal.set({ rounding: Decimal.ROUND_HALF_FLOOR })

    // const reward = new Decimal(R).mul(traderScore[addr]).div(traderScoreSum)
    // const floored = new dec(reward).round().toNumber()
    // const floored = new dec(reward).round().toFixed()
    const floored = new bn.BigNumber(traderRewardsAmount)
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    console.log('floored', floored)
    if (floored !== '0') {
      addReward(addressRewards, addr, floored)
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
    //const dec = Decimal.set({ rounding: Decimal.ROUND_HALF_FLOOR })
    //const reward = new Decimal(marketMakerRewardsAmount).mul(epochData.quoteScore[addr]).div(quoteScoreSum)
    //const floored = new dec(reward).round().toFixed()
    const floored = new bn.BigNumber(marketMakerRewardsAmount)
      .times(epochData.quoteScore[addr])
      .div(quoteScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    /*const floored = new Decimal(marketMakerRewardsAmount)
      .times(epochData.quoteScore[addr])
      .div(quoteScoreSum)
      .round()
      .toFixed()*/
    if (floored !== '0') {
      addReward(addressRewards, addr, floored)
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
