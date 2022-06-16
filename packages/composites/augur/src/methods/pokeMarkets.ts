import { InputParameters, Logger, Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, AdapterContext } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { DateTime } from 'luxon'

import { Config } from '../config'
import { CRYPTO_ABI } from './index'
import AggregatorV3InterfaceABI from '../abis/AggregatorV3Interface.json'

class RoundManagement {
  readonly phase: BigNumber
  readonly justRound: BigNumber

  constructor(phase: BigNumberish, justRound: BigNumberish) {
    this.phase = BigNumber.from(phase)
    this.justRound = BigNumber.from(justRound)
  }

  public get id(): BigNumber {
    return this.phase.shl(64).or(this.justRound)
  }

  public nextRound(): RoundManagement {
    return new RoundManagement(this.phase, this.justRound.add(1))
  }

  public prevRound(): RoundManagement {
    return new RoundManagement(this.phase, this.justRound.sub(1))
  }

  static decode(roundId: BigNumberish): RoundManagement {
    roundId = BigNumber.from(roundId)
    const phase = roundId.shr(64)
    const justRoundId = roundId.sub(phase.shl(64))
    return new RoundManagement(phase, justRoundId)
  }
}

async function getNextWeekResolutionTimestamp(contract: ethers.Contract): Promise<number> {
  const contractNextResolutionTime = await contract.nextResolutionTime()
  const now = DateTime.now().setZone('America/New_York').toSeconds()

  if (contractNextResolutionTime > now) {
    Logger.warn(`Augur: Next resolution time is in the future`)

    return 0
  }

  return getUpcomingFriday4pmET()
}

export function getUpcomingFriday4pmET(): number {
  const nowEastern = DateTime.now().setZone('America/New_York')
  const thisWeek = nowEastern.set({ weekday: 5, hour: 16, minute: 0, second: 0, millisecond: 0 })
  const past = thisWeek.diff(nowEastern).milliseconds < 0
  const when = past ? thisWeek.plus({ week: 1 }) : thisWeek
  return when.toSeconds()
}

interface Coin {
  name: string
  priceFeed: string
}

interface RoundData {
  roundId: BigNumberish
  startedAt: BigNumberish
  updatedAt: BigNumberish
}

interface RoundDataForCoin {
  coinId: number
  roundId: BigNumberish
}

export type TInputParameters = {
  contractAddress: string
}

const pokeParams: InputParameters<TInputParameters> = {
  contractAddress: true,
}

export async function execute(
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> {
  const validator = new Validator(input, pokeParams)

  const jobRunID = input.id

  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, CRYPTO_ABI, config.wallet)

  await pokeMarkets(contract, context, config)

  return Requester.success(jobRunID, {})
}

async function fetchResolutionRoundIds(
  resolutionTime: number,
  contract: ethers.Contract,
  _: AdapterContext,
  config: Config,
): Promise<RoundDataForCoin[]> {
  const coins: Coin[] = await contract.getCoins()
  return Promise.all(
    coins.map(async (coin, index) => {
      const aggregator = new ethers.Contract(
        coin.priceFeed,
        AggregatorV3InterfaceABI,
        config.wallet,
      )

      // Here we are going to walk backward through rounds to make sure that
      // we pick the *first* update after the passed-in resolutionTime
      let roundData: RoundData = await aggregator.latestRoundData()

      // If any of the coins can't be resolved, don't resolve any of them we
      // may want to change this
      if (roundData.updatedAt < resolutionTime) {
        throw Error(
          `Augur: cryptoMarkets - oracle update for ${coin.name} has not occured yet, resolutionTime is ${resolutionTime} but oracle was updated at ${roundData.updatedAt}`,
        )
      }

      let round = RoundManagement.decode(roundData.roundId)
      while (roundData.updatedAt >= resolutionTime) {
        roundData = await aggregator.getRoundData(round.prevRound().id)
        round = RoundManagement.decode(roundData.roundId)
      }

      return {
        coinId: index + 1, // add one because getCoins excludes the 0th Coin, which is a placeholder for "no coin"
        roundId: round.nextRound().id, // next round because we iterated one past the desired round
      }
    }),
  )
}

async function createAndResolveMarkets(
  roundDataForCoins: RoundDataForCoin[],
  nextWeek: number,
  contract: ethers.Contract,
  _: AdapterContext,
  config: Config,
) {
  //     function createAndResolveMarkets(uint80[] calldata _roundIds, uint256 _nextResolutionTime) public {
  const roundIds: BigNumberish[] = ([0] as BigNumberish[]).concat(
    roundDataForCoins.map((x) => x.roundId),
  )

  const nonce = await config.wallet.getTransactionCount()

  try {
    await contract.createAndResolveMarkets(roundIds, nextWeek, { nonce })
    Logger.log(`Augur: createAndResolveMarkets -- success`)
  } catch (e) {
    const error = e as Error
    Logger.log(`Augur: createAndResolveMarkets -- failure`)
    Logger.error(error)
  }
}

async function pokeMarkets(contract: ethers.Contract, context: AdapterContext, config: Config) {
  try {
    const resolutionTime: BigNumber = await contract.nextResolutionTime()
    const nextResolutionTime = await getNextWeekResolutionTimestamp(contract)
    if (nextResolutionTime > 0) {
      const roundIds = await fetchResolutionRoundIds(
        resolutionTime.toNumber(),
        contract,
        context,
        config,
      )
      await createAndResolveMarkets(roundIds, nextResolutionTime, contract, context, config)
    }
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
