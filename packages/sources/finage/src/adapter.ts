import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'

const customParams = {
  base: ['base', 'from', 'symbol'],
  endpoint: false,
}

const DEFAULT_ENDPOINT = 'stock'

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  let url: string
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const apikey = util.getRandomRequiredEnv('API_KEY')
  let responsePath
  let params

  switch (endpoint) {
    case 'stock': {
      url = `/last/stock/${symbol}`
      responsePath = ['bid']
      params = {
        apikey,
      }
      break
    }
    case 'eod': {
      url = `/agg/stock/prev-close/${symbol}`
      responsePath = ['results', 0, 'c']
      params = {
        apikey,
      }
      break
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, responsePath)
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
