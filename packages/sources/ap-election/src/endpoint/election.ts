import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['election']

export const endpointResultPaths = {
  example: 'price',
}

interface Candidate {
  first: string
  last: string
  abbrv: string
  party: string
  candidateID: string
  pollID: string
  ballotOrder: number
  polNum: string
  voteCount: number
  winner?: string
}

interface ReportingUnit {
  statePostal: string
  stateName: string
  level: string
  lastUpdated: string
  precinctsReporting: number
  precinctsTotal: number
  precinctsReportingPct: number
  candidates: Candidate[]
}

export interface ResponseSchema {
  electionDate: string
  timestamp: string
  races: {
    test: boolean
    resultsType: string
    raceID: string
    raceType: string
    raceTypeID: string
    offceID: string
    officeName: string
    party: string
    eevp: number
    national: boolean
    reportingUnits: ReportingUnit[]
  }[]
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  date: true,
  statePostal: true, // Validate only one
  level: false,
  officeID: true,
  raceType: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { level, raceType, date, ...rest } = validator.validated.data
  const url = `/elections/${date}`

  const params = {
    ...rest,
    level: level || 'state',
    raceTypeID: raceType || 'D',
    format: 'json',
    winner: 'X',
    resultsType: 'l',
    apikey: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = getRaceWinner(response.data)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

const getRaceWinner = (response: ResponseSchema): string => {
  const races = response.races
  if (races.length === 0) {
    throw Error('We could not find any races')
  }
  if (races.length > 1) {
    throw Error("We don't support finding the winner from multiple races")
  }
  const reportingUnits = races[0].reportingUnits
  const topLevelRU = getTopLevelReportingUnit(reportingUnits)
  const winner = getReportingUnitWinner(topLevelRU)
  return concatenateName(winner)
}

const getTopLevelReportingUnit = (reportingUnits: ReportingUnit[]): ReportingUnit => {
  let highestRU
  for (const ru of reportingUnits) {
    const level = ru.level
    // Only one of them will be national
    if (level === 'national') {
      return ru
    } else if (level === 'state') {
      // There will only be one state
      highestRU = ru
    }
  }
  if (!highestRU) throw Error('Cannot find either national or state reporting unit')
  return highestRU
}

const getReportingUnitWinner = (reportingUnit: ReportingUnit): Candidate => {
  for (const candidate of reportingUnit.candidates) {
    if (candidate.winner === 'X') {
      return candidate
    }
  }
  throw Error('Candidate not found')
}

const concatenateName = (candidate: Candidate): string => `${candidate.voteCount},${candidate.last}`
