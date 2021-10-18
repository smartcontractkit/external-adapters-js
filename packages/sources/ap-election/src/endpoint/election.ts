import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { utils } from 'ethers'

export const supportedEndpoints = ['election']

export const endpointResultPaths = {}

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
  precinctsReporting: number
  precinctsReportingPct: number
  winnerFirstName: string
  winnerLastName: string
  winnerVoteCount: number
  winnerCandidateId: string
  winnerParty: string
  candidates: string[]
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
  statePostal: true,
  officeID: false,
  raceType: false,
  raceID: false,
  resultsType: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  validateRequest(request)

  const jobRunID = validator.validated.id
  const { raceType, date, resultsType, ...rest } = validator.validated.data
  const url = `/elections/${date}`

  const params = {
    ...rest,
    level: 'state',
    raceTypeID: raceType,
    format: 'json',
    winner: 'X',
    resultsType: resultsType || 'l',
    apikey: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options, customError)
  validateResponse(response.data)

  const race = response.data.races[0]
  const reportingUnit = getReportingUnit(race.reportingUnits, rest.statePostal)
  const raceWinner = getReportingUnitWinner(reportingUnit)

  response.data.precinctsReporting = reportingUnit.precinctsReporting
  response.data.precinctsReportingPct = reportingUnit.precinctsReportingPct
  response.data.winnerFirstName = raceWinner.first
  response.data.winnerLastName = raceWinner.last
  response.data.winnerVoteCount = raceWinner.voteCount
  response.data.winnerCandidateId = raceWinner.candidateID
  response.data.winnerParty = raceWinner.party
  response.data.candidates = encodeCandidates(reportingUnit.candidates)

  return Requester.success(
    jobRunID,
    Requester.withResult(response, concatenateName(raceWinner)),
    config.verbose,
  )
}

const validateRequest = (request: AdapterRequest) => {
  const { statePostal, officeID, raceID } = request.data
  const statePostals = statePostal.split(',')
  if (statePostals.length > 1) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Adapter only supports finding results from a single state',
    })
  }
  if (!officeID && !raceID) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Either officeID or raceID must be present',
    })
  }
}

const validateResponse = (response: ResponseSchema) => {
  const races = response.races
  if (races.length === 0) {
    throw Error('We could not find any races')
  }
  if (races.length > 1) {
    throw Error("We don't support finding the winner from multiple races")
  }
}

const getReportingUnit = (reportingUnits: ReportingUnit[], statePostal: string): ReportingUnit => {
  // Response should only contain a national RU if the statePostal is US but will contain both national and state for any other statePostal codes.
  const level = statePostal === 'US' ? 'national' : 'state'
  const reportingUnit = reportingUnits.find((ru) => ru.level === level)
  if (!reportingUnit) {
    throw Error('Cannot find reporting unit')
  }
  return reportingUnit
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

const encodeCandidates = (candidates: Candidate[]): string[] => {
  const encodedCandidates: string[] = []
  const encodedValTypes = ['uint32', 'string', 'string', 'string', 'uint32', 'bool']
  const abiCoder = utils.defaultAbiCoder
  for (const { candidateID, party, first, last, voteCount, winner } of candidates) {
    const encodedCandidate = abiCoder.encode(encodedValTypes, [
      candidateID,
      party,
      first,
      last,
      voteCount,
      !!winner,
    ])
    encodedCandidates.push(encodedCandidate)
  }
  return encodedCandidates
}
