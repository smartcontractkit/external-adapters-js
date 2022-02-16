import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Decimal } from 'decimal.js'
import moment from 'moment-timezone'
import { XBCI, XLCI } from '../config'

export const supportedEndpoints = ['allocations']

export const inputParameters: InputParameters = {
  index: {
    type: 'string',
    required: true,
    description: 'The index to query for',
  },
}

interface Portfolio {
  name: string
  project_id: string
  symbol: string
  weight: number
  unit: number
  credibility_rating: string
}

interface ResponseSchema {
  data: {
    index_value: {
      value: number
      reference_timestamp_utc: string
    }
    portfolio_reference_utc: string
    portfolio: Portfolio[]
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const now = moment().tz('GMT').format('YYYY-MM-DD[T]hh:mm')
  const { index } = validator.validated.data
  const path = getURLPath(jobRunID, index)
  const options = {
    ...config.api,
    url: path,
    params: {
      reference_timestamp: now,
    },
  }
  const resp = await Requester.request<ResponseSchema>(options)
  const indices = resp.data.data.portfolio
  const allocations = indices.map((index) => ({
    symbol: index.symbol.toUpperCase(),
    balance: new Decimal(index.unit).mul(1e18).toFixed(0),
    decimals: 18,
  }))

  return {
    jobRunID,
    result: allocations.length,
    data: {
      allocations,
      result: allocations.length,
    },
    statusCode: 200,
  }
}

export const getURLPath = (jobRunID: string, index: string): string => {
  switch (index.toLowerCase()) {
    case XBCI:
      return '/v1/index/xangle-bluechip'
    case XLCI:
      return '/v1/index/xangle-largecap'
    default:
      throw new AdapterError({
        jobRunID,
        message: `${index} not supported. Must be one of ${XBCI}, ${XLCI}`,
        statusCode: 400,
      })
  }
}
