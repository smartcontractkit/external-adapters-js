import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import { ABI } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'

const createParams = {
  sport: true,
  contractAddress: true,
}

export interface CreateEvent {
  id: ethers.BigNumber
  homeTeamId: number
  awayTeamId: number
  startTime: number
  homeSpread: number
  totalScore: number
  createSpread: boolean
  createTotalScore: boolean
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)
  input.data.contract = contract

  let events: CreateEvent[] = []
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    events = (await theRundown.create(input)).result
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    events = (await sportsdataio.create(input)).result
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
      packCreationFlags(event.createSpread, event.createTotalScore),
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

  return Requester.success(input.id, {})
}

const packCreationFlags = (createSpread: boolean, createTotalScore: boolean): number => {
  let flags = 0b00000000;
  if (createSpread) flags += 0b00000001;
  if (createTotalScore) flags += 0b00000010;
  return flags;
}
