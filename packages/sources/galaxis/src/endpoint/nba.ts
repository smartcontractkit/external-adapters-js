import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import { Achievement } from '../types'
import { getEncodedCallsResult } from '../achievements'
import { ethers } from 'ethers'
import moment from 'moment'

export const supportedEndpoints = ['nba']

export interface ResponseSchema {
  player_achievements: Achievement[]
  team_achievements: Achievement[]
}

const customError = (data: Record<string, unknown>) => data.Response === 'Error'

export const description =
  'This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value'

export const inputParameters: InputParameters = {
  date: {
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const date = await getDate(config, validator.validated.data.date)
  config.api.url = await getURL(config, date)
  const options = config.api
  const response = await Requester.request<ResponseSchema>(options, customError)
  const encodedCalls = await getEncodedCallsResult(
    jobRunID,
    response.data.player_achievements,
    response.data.team_achievements,
    config,
    date,
  )
  const result = `0x${encodedCalls}`

  return {
    jobRunID,
    result,
    statusCode: 200,
    data: {
      result,
    },
  }
}

const getDate = async (config: ExtendedConfig, paramsDate?: string): Promise<string> => {
  const date = paramsDate
  if (date) {
    return date
  }
  const recordedDate = await config.ecRegistry.LastDate()
  if (isDateNotSet(recordedDate)) {
    throw new Error('Date not set')
  }
  const currentDate = ethers.utils.parseBytes32String(recordedDate)
  return moment(currentDate).add(1, 'day').format('YYYY-MM-DD')
}

const getURL = async (config: ExtendedConfig, date: string): Promise<string> => {
  if (isDateNotSet(date)) throw Error('No date set')
  const year = date.split('-')[0]
  return `${config.api.baseURL}/${year}/nightly_achievements_${date}.json` // YYYY-MM-DD
}

export const isDateNotSet = (date: string): boolean =>
  date === '0x0000000000000000000000000000000000000000000000000000000000000000'
