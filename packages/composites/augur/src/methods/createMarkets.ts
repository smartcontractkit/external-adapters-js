import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, AdapterRequest } from '@chainlink/types'
import { Config } from '../config'
import { FIGHTER_SPORTS, TEAM_ABI, TEAM_SPORTS } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'
import mmaABI from '../abis/mma.json'

const createParams = {
  sport: true,
  contractAddress: true,
}

export interface CreateTeamEvent {
  id: ethers.BigNumber
  homeTeamId: number
  awayTeamId: number
  startTime: number
  homeSpread: number
  totalScore: number
  createSpread: boolean
  createTotalScore: boolean
}

export interface CreateFighterEvent {
  id: ethers.BigNumber
  fighterA: number
  fighterAname: string
  fighterB: number
  fighterBname: string
  startTime: number
  moneylines: number[]
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  const contractAddress = validator.validated.data.contractAddress

  Logger.debug(`Augur: Picking code path for sport ${sport}`)
  if (TEAM_SPORTS.includes(sport)) {
    Logger.debug(`Augur: Picked TEAM code path for sport`)
    return await createTeam(input.id, sport, contractAddress, input, config)
  } else if (FIGHTER_SPORTS.includes(sport)) {
    Logger.debug(`Augur: Picked FIGHTER code path for sport`)
    return await createFighter(input.id, sport, contractAddress, input, config)
  } else {
    throw Error(`Unable to identify sport "${sport}"`)
  }
}

const createTeam = async (jobRunID: string, sport: string, contractAddress: string, input: AdapterRequest, config: Config) => {
  const contract = new ethers.Contract(contractAddress, TEAM_ABI, config.wallet)

  const req = {
    id: jobRunID,
    data: {
      ...input.data,
      contract,
      sport,
    }
  }

  let events: CreateTeamEvent[] = []
  Logger.debug(`Augur: Choosing data source for sport ${sport}`)
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    Logger.debug(`Augur: Chose TheRundown as the data source`)
    events = (await theRundown.create(req)).result
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    Logger.debug(`Augur: Chose SportsDataIO as the data source`)
    events = (await sportsdataio.createTeam(req)).result
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  Logger.debug(`Augur: Prepared to create ${events.length} events`)

  let failed = 0
  let succeeded = 0

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const payload = [
      event.id,
      event.homeTeamId,
      event.awayTeamId,
      Math.floor(event.startTime / 1000),
      Math.round(event.homeSpread*10),
      Math.round(event.totalScore*10),
      event.createSpread,
      event.createTotalScore,
      { nonce }
    ]
    try {
      const tx = await contract.createMarket(...payload)
      Logger.debug(`Created tx: ${tx.hash}`)
      nonce++
      succeeded++
    } catch (e) {
      failed++
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: ${succeeded} created markets`)
  Logger.debug(`Augur: ${failed} markets failed to create`)

  return Requester.success(jobRunID, {})
}

const createFighter = async (jobRunID: string, sport: string, contractAddress: string, input: AdapterRequest, config: Config) => {
  const contract = new ethers.Contract(contractAddress, mmaABI, config.wallet)

  const req = {
    id: jobRunID,
    data: {
      ...input.data,
      contract,
      sport,
    }
  }

  let events: CreateFighterEvent[] = []
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    // Note: currently no fighter sports implemented here
    events = (await theRundown.create(req)).result
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    events = (await sportsdataio.createFighter(req)).result
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  Logger.debug(`Augur: Prepared to create ${events.length} events`)

  let failed = 0
  let succeeded = 0

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const payload = [
      event.id,
      event.fighterAname,
      event.fighterA,
      event.fighterBname,
      event.fighterB,
      Math.floor(event.startTime / 1000),
      event.moneylines,
      { nonce }
    ]
    try {
      const tx = await contract.createMarket(...payload)
      Logger.debug(`Created tx: ${tx.hash}`)
      nonce++
      succeeded++
    } catch (e) {
      failed++
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: ${succeeded} created markets`)
  Logger.debug(`Augur: ${failed} markets failed to create`)

  return Requester.success(jobRunID, {})
}
