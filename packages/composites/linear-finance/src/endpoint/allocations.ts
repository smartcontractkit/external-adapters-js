import { AdapterInputError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'
import moment from 'moment-timezone'

const endpointConfig: { [index: string]: { url: string; symbolKey: 'symbol' | 'slug' } } = {
  xlci: {
    url: '/v1/index/xangle-largecap',
    symbolKey: 'symbol',
  },
  xbci: {
    url: '/v1/index/xangle-bluechip',
    symbolKey: 'symbol',
  },
  x30: {
    url: '/v1/index/x30',
    symbolKey: 'slug',
  },
}

export const supportedEndpoints = ['allocations']

export type TInputParameters = {
  index: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  index: {
    type: 'string',
    required: true,
    description: 'The index to query for',
  },
}

interface Portfolio {
  name: string
  project_id: string
  symbol?: string
  slug?: string
  weight: number
  unit: number
  credibility_rating: string
}

interface ResponseSchema {
  data: {
    index_value: {
      value: number
      timestamp: string
    }
    portfolio: Portfolio[]
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const now = moment().tz('GMT').subtract(1, 'minute').format('YYYY-MM-DD[T]hh:mm:ss') // 1 min. buffer to ensure portfolio snapshot has been added on Xangle
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
  const assets = resp.data.data.portfolio as Portfolio[]
  const allocations = assets.map((asset) => ({
    symbol: asset[endpointConfig[index]?.symbolKey]?.toUpperCase(),
    balance: new Decimal(asset.unit).mul(1e18).toFixed(0),
    decimals: 18,
  }))

  return {
    jobRunID,
    result: allocations.length,
    data: {
      allocations,
      result: allocations.length,
      statusCode: 200,
    },
    statusCode: 200,
  }
}

export const getURLPath = (jobRunID: string, index: string): string => {
  const url = endpointConfig[index.toLowerCase()]?.url

  if (!url)
    throw new AdapterInputError({
      jobRunID,
      message: `${index} not supported. Must be one of ${Object.keys(endpointConfig).join(',')}`,
      statusCode: 400,
    })

  return url
}
