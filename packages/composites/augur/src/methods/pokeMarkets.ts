import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
import { AggregatorV2V3InterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorV2V3InterfaceFactory'
import { Config } from '../config'
import { CRYPTO_ABI } from './index'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'

function parseRoundId(roundId: number) {
  return roundId >> 64
}

function encodeRoundId(rawRoundId: number) {
  return (rawRoundId << 64) | rawRoundId
}

function getNextWeekResolutionTimestamp(contract: ethers.Contract) {
  const nowEastern = DateTime.now().setZone('America/New_York')

  const contractNextResolutionTime = await contract.nextResolutionTime()

  if (contractNextResolutionTime > nowEastern.toSeconds()) {
    throw Error(
      `Augur: Next resolution time is in the future`
    )
  }

  return nowEastern.plus({ week: 1 }).set({ weekday: 5, hour: 16, minute: 0, second: 0, millisecond: 0 }).toSeconds()
}


interface Coin {
  name: string
  priceFeed: string
}

interface RoundData {
  roundId: number
  startedAt: number
  updatedAt: number
}

interface RoundDataForCoin extends RoundData {
  coinId: number
}

const pokeParams = {
  contractAddress: true,
  coinIndex: true,
}

export async function execute(input, config): ExecuteWithConfig<Config> {
  const validator = new Validator(input, pokeParams)
  if (validator.error) throw validator.error

  const jobRunID = input.id

  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, CRYPTO_ABI, config.wallet)

  try {
    await pokMarkets(contract, config)
  } catch (e) {
    return Requester.errored(jobRunID, e)
  }

  return Requester.success(jobRunID)
}

async function fetchResolutionRoundIds(
  resolutionTime: number,
  contract: ethers.Contract,
  config: Config,
): RoundDataForCoin {
  // TODO: Validate that this is a valid coin index?
  const coins: Coin[] = await contract.getCoins()
  return Promise.all(
    coins.map(async (coin, index): number => {

      const aggregator = AggregatorV2V3InterfaceFactory.connect(coin.priceFeed, config.wallet)

      // Here we are going to walk backward through rounds to make sure that
      // we pick the *first* update after the passed-in resolutionTime
      let roundData: RoundData = await aggregator.latestRoundData()
      let nextRoundData: RoundData | null = null

      while (roundData.updatedAt >= resolutionTime) {
        nextRoundData = roundData;
        roundData = await aggregator.getRoundData(
          encodeRoundId(parseRoundId(roundData.roundId) - 1),
        )
      }

      // If any of the coins can't be resolved, don't resolve any of them we
      // may want to change this
      if (nextRoundData === null) {
        throw Error(
          `Augur: cryptoMarkets - oracle update for ${coin.name} has not occured yet, resolutionTime is ${resolutionTime} but oracle was updated at ${roundData.updatedAt}`,
        )
      }

      return {
        coinId: index+1, // add one because getCoins excludes the 0th Coin, which is a placeholder for "no coin"
        roundId: nextRoundData.roundId
      }
    }),
  )
}

async function createAndResolveMarkets(roundDataForCoins: RoundDataForCoin[], nextWeek: number, contract: ethers.Contract, confg: Config) {
  let succeded = 0, failed = 0
  let nonce = await config.wallet.getTransactionCount()
  for(let data of roundDataForCoins) {
    try {
      const payload [
        roundDataForCoin.coinId,
        roundDataForCoin.roundId,
        { nonce }
      ]
      await contract.createAndResolveMarketsForCoin(payload)
      succeded++
      nonce++
    } catch(e) {
      failed++
      Logger.log(e)
    }
  }

  Logger.log(`Augur: createAndResolveMarkets -- success: ${succeded}, failed: ${failed}`)
}

async function pokeMarkets(contract: ethers.Contract, config: Config) {
  const nextWeekResolutionTimestamp = getNextWeekResolutionTimestamp(contract)
  const coinResolutionRoundIds = fetchResolutionRoundIds(contractNextResolutionTime, contract, config)

  await createAndResolveMarkets(coinResolutionRoundIds, nextWeekEastern, contract, config)
}
