import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import * as TheRundown from '@chainlink/therundown-adapter'
import { ABI, Event, eventIdToNum } from './index'
import { ethers } from 'ethers'

const createParams = {
  sportId: true,
  daysInAdvance: true,
  startBuffer: true,
  contractAddress: true
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
    console.debug(response)

    events.push(...response.result as Event[])
  }

  const filtered = events.filter(event => {
    const date = Date.parse(event.event_date)
    if ((date - Date.now()) / 1000 < startBuffer) return false

    if (!event.lines) return false
    // We need affiliate IDs 9 or 3
    if (!('9' in event.lines || '3' in event.lines)) return false

    return true
  })

  const packed = filtered.map((event) => {
    const homeTeam = event.teams.find(team => team.is_home)
    if (!homeTeam) return undefined

    const awayTeam = event.teams.find(team => team.is_away)
    if (!awayTeam) return undefined

    const startTime = Date.parse(event.event_date)

    let affiliateId = 3
    if (!event.lines) return undefined
    // Pick affiliate ID 9 as primary
    if ('9' in event.lines) affiliateId = 9

    const homeSpread = event.lines[affiliateId].spread.point_spread_home
    const totalScore = 0 // TODO: Wait for them to update doc

    return packCreation(event.event_id, homeTeam.team_id, awayTeam.team_id, startTime, homeSpread, totalScore)
  }).filter((event) => !!event)

  let nonce = await config.wallet.getTransactionCount() + 1
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
    [eventIdToNum(eventId), homeTeamId, awayTeamId, Math.floor(startTime / 1000), homeSpread, totalScore] // TODO: Clarify with them that they need UNIX
  )
  const buf = Buffer.from(encoded.substr(2), 'hex')

  const mapping = [16, 2, 2, 4, 2, 2]
  let finalStr = '0x'
  for (let i = 0; i < mapping.length; i++) {
    const offset = 32 * (i+1)
    finalStr += buf.slice(offset - mapping[i], offset).toString('hex')
  }

  return ethers.utils.hexZeroPad(finalStr, 32)
}
