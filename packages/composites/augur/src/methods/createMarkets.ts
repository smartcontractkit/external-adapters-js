import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import * as TheRundown from '@chainlink/therundown-adapter'
import { ABI, Event, eventIdToNum, bytesMappingToHexStr } from './index'
import { ethers } from 'ethers'

const createParams = {
  sportId: true,
  daysInAdvance: true,
  startBuffer: true,
  contractAddress: true,
  affiliateIds: true
}

const addDays = (date: Date, days: number): Date => {
  date.setDate(date.getDate() + days)
  return date
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sportId = validator.validated.data.sportId
  const daysInAdvance = validator.validated.data.daysInAdvance
  const startBuffer = validator.validated.data.startBuffer
  const contractAddress = validator.validated.data.contractAddress
  const affiliateIds: number[] = validator.validated.data.affiliateIds
  const getAffiliateId = (event: Event) => affiliateIds.find((id) => !!event.lines && id in event.lines)

  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)

  const params = { id: input.id, data: {
    sportId,
    status: 'STATUS_SCHEDULED',
    date: new Date(),
    endpoint: 'events'
  }}
  const theRundownExec = TheRundown.makeExecute()

  const events = []
  for (let i = 0; i < daysInAdvance; i++) {
    params.data.date = addDays(params.data.date, 1)

    const response = await theRundownExec(params)
    events.push(...response.result as Event[])
  }

  // filter markets and build payloads for market creation
  const packed = [];
  for (const event of events) {
    const startTime = Date.parse(event.event_date)
    if ((startTime - Date.now()) / 1000 < startBuffer) continue // markets would end too soon

    // skip if data is missing
    const affiliateId = getAffiliateId(event)
    const homeTeam = event.teams_normalized.find(team => team.is_home)
    const awayTeam = event.teams_normalized.find(team => team.is_away)
    if (!affiliateId || !homeTeam || !awayTeam) continue

    const eventId = eventIdToNum(event.event_id)
    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber] = await contract.getEventMarkets(eventId)

    // only create spread and totalScore markets if lines exist; always create headToHead market
    let homeSpread = transformSpecialNone(event.lines?.[affiliateId].spread.point_spread_home)
    let totalScore = transformSpecialNone(event.lines?.[affiliateId].total.total_over)
    const createSpread = homeSpread !== undefined
    const createTotalScore = totalScore !== undefined
    homeSpread = homeSpread || 0
    totalScore = totalScore || 0
    const canCreate = headToHeadMarket.isZero() || (spreadMarket.isZero() && createSpread) || (totalScoreMarket.isZero() && createTotalScore)
    if (!canCreate) continue

    packed.push(packCreation(event.event_id, homeTeam.team_id, awayTeam.team_id, startTime, homeSpread, totalScore, createSpread, createTotalScore))
  }

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < packed.length; i++) {
    await contract.createMarket(packed[i], { nonce: nonce++ })
  }

  return Requester.success(input.id, {})
}

const transformSpecialNone = (val?: number) => val === 0.0001 ? undefined : val

export const packCreation = (
  eventId: string,
  homeTeamId: number,
  awayTeamId: number,
  startTime: number,
  homeSpread: number,
  totalScore: number,
  createSpread: boolean,
  createTotalScore: boolean,
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint16', 'uint16', 'uint32', 'int16', 'uint16', 'uint8'],
    [
      eventIdToNum(eventId),
      homeTeamId,
      awayTeamId,
      Math.floor(startTime / 1000),
      Math.round(homeSpread*10),
      Math.round(totalScore*10),
      packCreationFlags(createSpread, createTotalScore)
    ]
  )

  const mapping = [16, 2, 2, 4, 2, 2, 1]
  return bytesMappingToHexStr(mapping, encoded)
}

const packCreationFlags = (createSpread: boolean, createTotalScore: boolean): number => {
  let flags = 0b00000000;
  if (createSpread) flags += 0b00000001;
  if (createTotalScore) flags += 0b00000010;
  return flags;
}
