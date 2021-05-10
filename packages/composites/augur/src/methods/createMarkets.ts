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

  const filtered = events.filter(event => {
    const date = Date.parse(event.event_date)
    if ((date - Date.now()) / 1000 < startBuffer) return false

    return !!getAffiliateId(event)
  })

  const packed = filtered.map((event) => {
    const homeTeam = event.teams.find(team => team.is_home)
    if (!homeTeam) return undefined

    const awayTeam = event.teams.find(team => team.is_away)
    if (!awayTeam) return undefined

    const startTime = Date.parse(event.event_date)

    const affiliateId = getAffiliateId(event)
    if (!affiliateId) return undefined

    const homeSpread = event.lines?.[affiliateId].spread.point_spread_home
    const totalScore = event.lines?.[affiliateId].total.total_over
    if (!homeSpread || !totalScore) return undefined

    return packCreation(event.event_id, homeTeam.team_noramlized_id, awayTeam.team_normalized_id, startTime, homeSpread, totalScore)
  }).filter((event) => !!event)

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < packed.length; i++) {
    const eventId = eventIdToNum(filtered[i].event_id)
    const isRegistered = await contract.isEventRegistered(eventId)
    if (isRegistered) continue

    await contract.createMarket(packed[i], { nonce: nonce++ })
  }

  return Requester.success(input.id, {})
}

export const packCreation = (
  eventId: string,
  homeTeamId: number,
  awayTeamId: number,
  startTime: number,
  homeSpread: number,
  totalScore: number
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint16', 'uint16', 'uint32', 'int16', 'uint16'],
    [
      eventIdToNum(eventId),
      homeTeamId,
      awayTeamId,
      Math.floor(startTime / 1000),
      Math.round(homeSpread*10),
      Math.round(totalScore*10)
    ]
  )

  const mapping = [16, 2, 2, 4, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
