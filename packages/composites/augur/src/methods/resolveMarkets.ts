import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import * as TheRundown from '@chainlink/therundown-adapter'
import { ABI, Event, eventIdToNum, bytesMappingToHexStr } from './index'
import { ethers } from 'ethers'

const resolveParams = {
  sportId: true,
  contractAddress: true
}

const subDays = (date: Date, days: number): Date => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() - days)
  return newDate
}

const TWO_HOURS_ms = 1000 * 60 * 60 * 2

// The `past` argument can be in the future without issue.
const timeHasPassed = (present: Date, past: Date, milliseconds: number): boolean => {
  const msPassed = Number(present) - Number(past)
  return msPassed >= milliseconds
}

const eventStatus: { [key: string]: number } = {
  'STATUS_SCHEDULED': 1,
  'STATUS_FINAL': 2,
  'STATUS_POSTPONED': 3,
  'STATUS_CANCELED': 4
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const sportId = validator.validated.data.sportId
  const contractAddress = validator.validated.data.contractAddress

  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)

  const params = { id: input.id, data: {
      sportId,
      date: new Date(),
      endpoint: 'events'
    }}
  const theRundownExec = TheRundown.makeExecute()

  const today = new Date();
  const events = []
  for (let i = 0; i < 2; i++) {
    params.data.date = subDays(today, i)

    const response = await theRundownExec(params)
    events.push(...response.result as Event[])
  }

  const statusCompleted = [
    'STATUS_CANCELED',
    'STATUS_FINAL',
    'STATUS_POSTPONED'
  ]

  const filtered = events
    .filter(({ score: { event_status }}) => statusCompleted.includes(event_status))
    .filter(({ event_date }) => timeHasPassed(today, new Date(Date.parse(event_date)), TWO_HOURS_ms))

  const packed = filtered.map((event) => {
    const status = eventStatus[event.score.event_status]
    if (!status) return undefined

    return packResolution(event.event_id, status, event.score.score_home, event.score.score_away)
  }).filter((event) => !!event)

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < packed.length; i++) {
    const eventId = eventIdToNum(filtered[i].event_id)

    try {
      const isResolved = await contract.isEventResolved(eventId)
      if (isResolved) continue
    } catch (e) {
      // Skip if contract call fails, this is likely a
      // market that wasn't created
      continue
    }

    await contract.trustedResolveMarkets(packed[i], { nonce: nonce++ })
  }

  return Requester.success(input.id, {})
}

export const packResolution = (
  eventId: string,
  eventStatus: number,
  homeScore: number,
  awayScore: number
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint8', 'uint16', 'uint16'],
    [eventIdToNum(eventId), eventStatus, Math.round(homeScore*10), Math.round(awayScore*10)]
  )

  const mapping = [16, 1, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
