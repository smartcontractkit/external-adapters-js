import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
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

export const description =
  'This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value'

export type TInputParameters = { date: string }
export const inputParameters: InputParameters<TInputParameters> = {
  date: {
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const date = await getDate(config, validator.validated.data.date)
  if (config.api) config.api.url = await getURL(config, date)
  const options = config.api || {}
  const response = await Requester.request<ResponseSchema>(options)
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
      statusCode: 200,
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
    throw new AdapterError({ message: `Ethers contract 'last date' date not set` })
  }
  const currentDate = ethers.utils.parseBytes32String(recordedDate)
  return moment(currentDate).add(1, 'day').format('YYYY-MM-DD')
}

const getURL = async (config: ExtendedConfig, date: string): Promise<string> => {
  if (isDateNotSet(date))
    throw new AdapterError({ message: 'No date found when attempting to get URL' })
  const year = date.split('-')[0]
  return `${config.api?.baseURL}/${year}/nightly_achievements_${date}.json` // YYYY-MM-DD
}

export const isDateNotSet = (date: string): boolean =>
  date === '0x0000000000000000000000000000000000000000000000000000000000000000'
