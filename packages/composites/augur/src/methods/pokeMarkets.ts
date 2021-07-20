import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
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

  const expectedRunTimeSeconds = await contract.nextResolutionTime()
  if (nowEastern.weekday !== 4) {
    throw Error(
      `Augur: cryptoMarkets - attempted poke at invalid time ${nowEastern}, must be Thursday`,
    )
  }

  if (nowEastern.hour !== 16) {
    throw Error(
      `Augur: cryptoMarkets - attempted poke at invalid time - ${nowEastern}, must be during 4 o'clock hour, eastern`,
    )
  }

  const contractNextResolutionTime = await contract.nextResolutionTime()

  if (contractNextResolutionTime > nowEastern.toSeconds()) {
    throw Error(
      `Augur: Next resolution time is in the future`
    )
  }

  return nowEastern.plus({ week: 1 }).set({ minute: 0, second: 0, millisecond: 0 }).toSeconds()
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
      const aggregatorProxy = new ethers.Contract(
        coin.priceFeed,
        EACAggregatorProxyAbi,
        config.wallet,
      )

      // Here we are going to walk backward through rounds to make sure that
      // we pick the *first* update after the passed-in resolutionTime
      let roundData: RoundData = await aggregatorProxy.latestRoundData()
      let nextRoundData: RoundData | null = null

      while (roundData.updatedAt >= resolutionTime) {
        nextRoundData = roundData;
        roundData = await agregatorProxy.getRoundData(
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
        coinId: index+1,
        roundId: nextRoundData.roundId
      }
    }),
  )
}

async function createAndResolveMarkets(roundDataForCoin: RoundDataForCoin, nextWeek: number, contract: ethers.Contract, confg: Config) {
  let success = 0, failed = 0
  let nonce = await config.wallet.getTransactionCount()
  for(let tx of transactions) {
    try {
      const payload [
        roundDataForCoin.coinId,
        roundDataForCoin.roundId,
        { nonce }
      ]
      await contract.createAndResolveMarketsForCoin(payload)
      success++
      nonce++
    } catch(e) {
      failed++
    }
  }
}

async function pokeMarkets(contract: ethers.Contract, config: Config) {
  const nextWeekResolutionTimestamp = getNextWeekResolutionTimestamp(contract)
  const coinResolutionRoundIds = fetchResolutionRoundIds(contractNextResolutionTime, contract, config)

  await createAndResolveMarkets(coinResolutionRoundIds, nextWeekEastern, contract, config)
}
